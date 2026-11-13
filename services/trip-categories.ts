import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TripCategory } from "@/types/catalog";

export const LEGACY_TRIP_CATEGORIES: TripCategory[] = [
  { id: "mountain", slug: "mountain", name: "Gunung", sortOrder: 1, isActive: true },
  { id: "beach", slug: "beach", name: "Pantai", sortOrder: 2, isActive: true },
  { id: "waterfall", slug: "waterfall", name: "Air Terjun", sortOrder: 3, isActive: true },
];

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export function mapTripCategory(row: CategoryRow): TripCategory {
  return {
    id: row.id, slug: row.slug, name: row.name,
    sortOrder: row.sort_order, isActive: row.is_active,
  };
}

/** Legacy defaults keep the old site readable until the migration is deployed. */
export async function getPublicTripCategories(): Promise<TripCategory[]> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return LEGACY_TRIP_CATEGORIES;
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await client.from("trip_categories")
    .select("id,slug,name,sort_order,is_active")
    .eq("is_active", true).order("sort_order").order("name");
  if (error) {
    console.error("Trip category catalog could not be loaded", error.message);
    return LEGACY_TRIP_CATEGORIES;
  }
  return (data as CategoryRow[]).map(mapTripCategory);
}

export async function getAdminTripCategories(): Promise<TripCategory[]> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await client.from("trip_categories")
    .select("id,slug,name,sort_order,is_active").order("sort_order").order("name");
  if (error) throw new Error(`Gagal memuat kategori: ${error.message}`);
  return (data as CategoryRow[]).map(mapTripCategory);
}
