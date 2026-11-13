import type { TripDestination } from "@/types/catalog";
import { normalizeDestination } from "@/lib/catalog-utils";

/**
 * A stale/invalid published snapshot must never take the whole public
 * catalog offline. Staff can still inspect the original data in Supabase.
 */
export function safePublicTrip(payload: unknown): TripDestination | null {
  try {
    return normalizeDestination(payload as TripDestination, "published");
  } catch {
    const id = payload && typeof payload === "object" && "id" in payload
      ? String((payload as { id: unknown }).id).slice(0, 120) : "unknown";
    console.error("Invalid published catalog snapshot skipped", { tripId: id });
    return null;
  }
}
