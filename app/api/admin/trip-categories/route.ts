import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeAdminApi } from "@/lib/api-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminTripCategories } from "@/services/trip-categories";
import { categoriesForTrip } from "@/lib/list-trip";
import type { TripDestination } from "@/types/catalog";

const schema = z.object({
  id: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(80),
  sortOrder: z.number().int().positive().max(9999),
  isActive: z.boolean(),
});

export async function GET() {
  const auth = await authorizeAdminApi();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ categories: await getAdminTripCategories() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memuat kategori." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return mutateCategory(request, "create");
}
export async function PATCH(request: Request) {
  return mutateCategory(request, "update");
}
export async function DELETE(request: Request) {
  return mutateCategory(request, "delete");
}

async function mutateCategory(request: Request, action: "create" | "update" | "delete") {
  const auth = await authorizeAdminApi(["ADMIN"]);
  if (!auth.ok) return auth.response;
  const client = await createSupabaseServerClient();
  if (!client) return NextResponse.json({ error: "Supabase tidak tersedia." }, { status: 503 });
  const input = await request.json().catch(() => null);
  if (action === "delete") {
    const id = z.string().min(1).max(80).safeParse(input?.id);
    if (!id.success) return NextResponse.json({ error: "ID kategori wajib diisi." }, { status: 400 });
    const { data: category } = await client.from("trip_categories").select("slug").eq("id", id.data).maybeSingle();
    if (!category) return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    // Check draft and published snapshots. Never delete a category referenced by a trip.
    const { data: documents, error: listError } = await client.from("catalog_documents")
      .select("draft_payload,published_payload");
    if (listError) return NextResponse.json({ error: "Tidak dapat memverifikasi penggunaan kategori." }, { status: 500 });
    const used = (documents ?? []).some((doc) =>
      [doc.draft_payload, doc.published_payload].some((payload) =>
        payload && categoriesForTrip(payload as TripDestination).includes(category.slug)
      )
    );
    if (used) return NextResponse.json({ error: "Kategori masih digunakan. Nonaktifkan, jangan hapus." }, { status: 409 });
    const { error } = await client.from("trip_categories").delete().eq("id", id.data);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  }

  const result = schema.safeParse(input);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Input tidak valid." }, { status: 400 });
  if (action === "update") {
    if (!result.data.id) return NextResponse.json({ error: "ID kategori wajib." }, { status: 400 });
    const { data: original } = await client.from("trip_categories")
      .select("slug").eq("id", result.data.id).maybeSingle();
    if (!original) return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
    if (original.slug !== result.data.slug) return NextResponse.json({
      error: "Slug kategori tidak dapat diubah karena mungkin digunakan oleh trip.",
    }, { status: 409 });
  }
  const values = {
    slug: result.data.slug, name: result.data.name,
    sort_order: result.data.sortOrder, is_active: result.data.isActive,
    updated_at: new Date().toISOString(),
  };
  if (action === "create") {
    const { error } = await client.from("trip_categories").insert({ ...values, id: result.data.id ?? result.data.slug });
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true }, { status: 201 });
  }
  if (!result.data.id) return NextResponse.json({ error: "ID kategori wajib." }, { status: 400 });
  const { error } = await client.from("trip_categories").update(values).eq("id", result.data.id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
