import { createClient } from "@supabase/supabase-js";
import { summarizeMonitoringEvents } from "@/lib/monitoring";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CatalogEvent, MonitoringSummary } from "@/types/monitoring";

type EventInput = Omit<CatalogEvent, "id" | "createdAt">;
type EventRow = {
  id: string;
  event_type: CatalogEvent["eventType"];
  destination_id: string;
  destination_slug: string;
  destination_name: string;
  departure_id: string | null;
  departure_label: string | null;
  session_id: string;
  created_at: string;
};

function startOfThirtyDays() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString();
}

function eventDocumentId(input: EventInput, createdAt: string) {
  return [input.eventType, input.destinationId, input.departureId ?? "all", input.sessionId, createdAt.slice(0, 10)]
    .join("_")
    .replaceAll("/", "-");
}

function fromRow(row: EventRow): CatalogEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    destinationId: row.destination_id,
    destinationSlug: row.destination_slug,
    destinationName: row.destination_name,
    departureId: row.departure_id,
    departureLabel: row.departure_label,
    sessionId: row.session_id,
    createdAt: row.created_at,
  };
}

export async function recordCatalogEvent(input: EventInput) {
  if (!isSupabaseConfigured) throw new Error("Supabase belum dikonfigurasi.");
  const createdAt = new Date().toISOString();
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { error } = await client.from("catalog_events").insert({
    id: eventDocumentId(input, createdAt), event_type: input.eventType,
    destination_id: input.destinationId, destination_slug: input.destinationSlug,
    destination_name: input.destinationName, departure_id: input.departureId,
    departure_label: input.departureLabel, session_id: input.sessionId, created_at: createdAt,
  });
  if (error && error.code !== "23505") throw error;
}

export async function getMonitoringSummary(): Promise<MonitoringSummary> {
  const since = startOfThirtyDays();
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase.from("catalog_events").select("*")
    .gte("created_at", since).order("created_at", { ascending: false }).limit(1000);
  if (error) throw error;
  return summarizeMonitoringEvents((data ?? []).map((row) => fromRow(row as EventRow)), since);
}
