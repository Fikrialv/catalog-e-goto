import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditAction,
  AuditLog,
  CatalogRecord,
  PublicationStatus,
  TripDestination,
} from "@/types/catalog";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import {
  clone,
  compareDestinationsByDeparture,
  createChangeSummary,
  normalizeDestination,
  nowIso,
} from "@/lib/catalog-utils";
import { parseDestinationPayload } from "@/lib/validation";

export type CatalogRepository = {
  listPublic(): Promise<TripDestination[]>;
  getPublicBySlug(slug: string): Promise<TripDestination | undefined>;
  listAdmin(): Promise<CatalogRecord[]>;
  getAdmin(id: string): Promise<CatalogRecord | undefined>;
  createDraft(payload: TripDestination, userId: string): Promise<CatalogRecord>;
  saveDraft(
    id: string,
    payload: TripDestination,
    userId: string,
  ): Promise<CatalogRecord>;
  publish(id: string, userId: string): Promise<CatalogRecord>;
  unpublish(id: string, userId: string): Promise<CatalogRecord>;
  archive(id: string, userId: string): Promise<CatalogRecord>;
  restore(id: string, userId: string): Promise<CatalogRecord>;
  duplicate(id: string, userId: string): Promise<CatalogRecord>;
  listAudit(entityId?: string): Promise<AuditLog[]>;
};

function makeRecord(
  payload: TripDestination,
  status: PublicationStatus = "published",
): CatalogRecord {
  const draft = normalizeDestination(
    payload,
    status === "archived" ? "draft" : status,
  );
  const published =
    status === "published" ? normalizeDestination(payload, "published") : null;
  return {
    id: payload.id,
    slug: payload.slug,
    status,
    draft,
    published,
    draftVersion: 1,
    publishedVersion: published ? 1 : 0,
    publishedAt: published ? (payload.publishedAt ?? payload.updatedAt) : null,
    updatedAt: payload.updatedAt,
  };
}

type SupabaseRecordRow = {
  id: string;
  slug: string;
  publication_status: PublicationStatus;
  draft_payload: TripDestination;
  published_payload: TripDestination | null;
  draft_version: number;
  published_version: number;
  published_at: string | null;
  updated_at: string;
};

class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async row(id: string) {
    const result = await this.client
      .from("catalog_documents")
      .select("*")
      .eq("id", id)
      .maybeSingle<SupabaseRecordRow>();
    if (result.error) throw result.error;
    return result.data ? this.fromRow(result.data) : undefined;
  }

  private fromRow(row: SupabaseRecordRow): CatalogRecord {
    return {
      id: row.id,
      slug: row.slug,
      status: row.publication_status,
      draft: parseDestinationPayload(row.draft_payload),
      published: row.published_payload
        ? parseDestinationPayload(row.published_payload)
        : null,
      draftVersion: row.draft_version,
      publishedVersion: row.published_version,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    };
  }

  private async writeAudit(
    action: AuditAction,
    beforeData: unknown,
    afterData: unknown,
    userId: string,
    entityId: string,
    publishedVersion: number | null,
  ) {
    const { error } = await this.client.from("audit_logs").insert({
      action,
      before_data: beforeData,
      after_data: afterData,
      user_id: userId,
      entity_type: "destination",
      entity_id: entityId,
      published_version: publishedVersion,
    });
    if (error) throw error;
  }

  async listPublic() {
    const { data, error } = await this.client
      .from("catalog_documents")
      .select(
        "published_payload,published_at,published_version,publication_status",
      )
      .eq("publication_status", "published")
      .not("published_payload", "is", null)
      .returns<
        Pick<
          SupabaseRecordRow,
          | "published_payload"
          | "published_at"
          | "published_version"
          | "publication_status"
        >[]
      >();
    if (error) throw error;
    return data
      .map((row) => ({
        ...normalizeDestination(
          parseDestinationPayload(row.published_payload),
          "published",
        ),
        publishedAt: row.published_at,
        publishedVersion: row.published_version,
        schedules:
          row.published_payload?.schedules.filter(
            (schedule) => schedule.publicationStatus === "published",
          ) ?? [],
      }))
      .sort(compareDestinationsByDeparture);
  }

  async getPublicBySlug(slug: string) {
    const { data, error } = await this.client
      .from("catalog_documents")
      .select("published_payload,published_at,published_version")
      .eq("slug", slug)
      .eq("publication_status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!data?.published_payload) return undefined;
    const publishedPayload = parseDestinationPayload(data.published_payload);
    return {
      ...normalizeDestination(publishedPayload, "published"),
      publishedAt: data.published_at,
      publishedVersion: data.published_version,
      schedules: publishedPayload.schedules.filter(
        (schedule: TripDestination["schedules"][number]) =>
          schedule.publicationStatus === "published",
      ),
    };
  }

  async listAdmin() {
    const { data, error } = await this.client
      .from("catalog_documents")
      .select("*")
      .returns<SupabaseRecordRow[]>();
    if (error) throw error;
    return data
      .map((row) => this.fromRow(row))
      .sort((a, b) => compareDestinationsByDeparture(a.draft, b.draft));
  }

  async getAdmin(id: string) {
    return this.row(id);
  }

  async createDraft(payload: TripDestination, userId: string) {
    const parsed = normalizeDestination(
      parseDestinationPayload(payload),
      "draft",
    );
    const record = makeRecord(parsed, "draft");
    const { error } = await this.client.from("catalog_documents").insert({
      id: record.id,
      slug: record.slug,
      publication_status: "draft",
      draft_payload: record.draft,
      published_payload: null,
      draft_version: 1,
      published_version: 0,
      published_at: null,
    });
    if (error) throw error;
    await this.writeAudit(
      "CREATE",
      null,
      record.draft,
      userId,
      record.id,
      null,
    );
    return record;
  }

  async saveDraft(id: string, payload: TripDestination, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const parsed = normalizeDestination(
      parseDestinationPayload(payload),
      "draft",
    );
    const draftVersion = record.draftVersion + 1;
    const { data, error } = await this.client
      .from("catalog_documents")
      .update({
        draft_payload: parsed,
        draft_version: draftVersion,
        slug: parsed.slug,
        updated_at: nowIso(),
      })
      .eq("id", id)
      .select("*")
      .single<SupabaseRecordRow>();
    if (error) throw error;
    await this.writeAudit(
      "SAVE_DRAFT",
      record.draft,
      parsed,
      userId,
      id,
      record.publishedVersion || null,
    );
    return this.fromRow(data);
  }

  async publish(id: string, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const publishedAt = nowIso();
    const published = normalizeDestination(record.draft, "published");
    published.publishedAt = publishedAt;
    published.publishedVersion = record.draftVersion;
    const { data, error } = await this.client
      .from("catalog_documents")
      .update({
        publication_status: "published",
        published_payload: published,
        published_version: record.draftVersion,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", id)
      .select("*")
      .single<SupabaseRecordRow>();
    if (error) throw error;
    await this.writeAudit(
      "PUBLISH",
      record.published,
      published,
      userId,
      id,
      record.draftVersion,
    );
    revalidateTag("egoto-public-catalog", "max");
    return this.fromRow(data);
  }

  async unpublish(id: string, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const { data, error } = await this.client
      .from("catalog_documents")
      .update({
        publication_status: "draft",
        published_payload: null,
        published_at: null,
        updated_at: nowIso(),
      })
      .eq("id", id)
      .select("*")
      .single<SupabaseRecordRow>();
    if (error) throw error;
    await this.writeAudit(
      "UNPUBLISH",
      record.published,
      null,
      userId,
      id,
      null,
    );
    revalidateTag("egoto-public-catalog", "max");
    return this.fromRow(data);
  }

  async archive(id: string, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const { data, error } = await this.client
      .from("catalog_documents")
      .update({
        publication_status: "archived",
        published_payload: null,
        published_at: null,
        updated_at: nowIso(),
      })
      .eq("id", id)
      .select("*")
      .single<SupabaseRecordRow>();
    if (error) throw error;
    await this.writeAudit("ARCHIVE", record, data, userId, id, null);
    revalidateTag("egoto-public-catalog", "max");
    return this.fromRow(data);
  }

  async restore(id: string, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const { data, error } = await this.client
      .from("catalog_documents")
      .update({ publication_status: "draft", updated_at: nowIso() })
      .eq("id", id)
      .select("*")
      .single<SupabaseRecordRow>();
    if (error) throw error;
    await this.writeAudit(
      "RESTORE",
      record,
      data,
      userId,
      id,
      record.publishedVersion || null,
    );
    revalidateTag("egoto-public-catalog", "max");
    return this.fromRow(data);
  }

  async duplicate(id: string, userId: string) {
    const record = await this.row(id);
    if (!record) throw new Error("Destination tidak ditemukan.");
    const payload = clone(record.draft);
    payload.id = `${payload.id}-copy-${Date.now()}`;
    payload.slug = `${payload.slug}-copy`;
    payload.name = `${payload.name} (copy)`;
    payload.publicationStatus = "draft";
    return this.createDraft(payload, userId);
  }

  async listAudit(entityId?: string) {
    let query = this.client
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });
    if (entityId) query = query.eq("entity_id", entityId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      beforeData: row.before_data,
      afterData: row.after_data,
      userId: row.user_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      publishedVersion: row.published_version,
      createdAt: row.created_at,
    })) as AuditLog[];
  }
}

export async function getCatalogRepository(): Promise<CatalogRepository> {
  if (!isSupabaseConfigured)
    throw new Error("Supabase belum dikonfigurasi.");
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase client tidak tersedia.");
  return new SupabaseCatalogRepository(client);
}

export function getPublicCatalogRepository(): CatalogRepository {
  if (!isSupabaseConfigured)
    throw new Error("Supabase belum dikonfigurasi.");
  return new SupabaseCatalogRepository(
    createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
  );
}

export function summarizeRecord(record: CatalogRecord) {
  return createChangeSummary(record.published, record.draft);
}
