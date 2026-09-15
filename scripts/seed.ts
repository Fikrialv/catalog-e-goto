import { createClient } from "@supabase/supabase-js";
import { destinations } from "@/data/catalog";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running db:seed.",
  );
}

const client = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const rows = destinations.map((destination) => ({
  id: destination.id,
  slug: destination.slug,
  publication_status: destination.publicationStatus,
  draft_payload: destination,
  published_payload:
    destination.publicationStatus === "published" ? destination : null,
  draft_version: 1,
  published_version: destination.publicationStatus === "published" ? 1 : 0,
  published_at:
    destination.publicationStatus === "published"
      ? destination.updatedAt
      : null,
}));

async function main() {
  const { error } = await client
    .from("catalog_documents")
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(
    `Seeded ${rows.length} destinations. CMC schedules: ${destinations.find((item) => item.id === "cmc-tumpak-sewu")?.schedules.length ?? 0}.`,
  );
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : JSON.stringify(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
});
