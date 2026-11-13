import type { TripDestination } from "@/types/catalog";

/** Master List Trip drafts must not silently invent a departure in the Catalog. */
export function createBlankMasterTrip(now = new Date()): TripDestination {
  const stamp = now.getTime();
  const id = `destination-${stamp}`;
  return {
    id,
    slug: `destination-baru-${stamp}`,
    name: "Destination baru",
    category: "mountain",
    categories: ["mountain"],
    routes: [],
    location: "",
    duration: "2 Hari 1 Malam",
    description: "",
    coverImage: { src: "", alt: "Gambar destination", sortOrder: 1 },
    gallery: [],
    prices: [],
    schedules: [],
    includes: [],
    excludes: [],
    notes: [],
    itinerary: [],
    highlights: [],
    publicationStatus: "draft",
    updatedAt: now.toISOString(),
    publishedAt: null,
    publishedVersion: 0,
  };
}
