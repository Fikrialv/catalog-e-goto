import type { TripDestination } from "@/types/catalog";

export function normalizeTripCategories(categories: string[]): string[] {
  return [...new Set(categories.map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function categoriesForTrip(trip: Pick<TripDestination,"category" | "categories">): string[] {
  return trip.categories?.length ? normalizeTripCategories(trip.categories) : [trip.category];
}

export function filterListTrips<T extends TripDestination>(
  trips: T[],
  category: string,
  query: string,
): T[] {
  const needle = query.trim().toLocaleLowerCase("id");
  return trips.filter((trip) =>
    (category === "all" || categoriesForTrip(trip).includes(category)) &&
    (!needle || [trip.name, trip.location ?? "", trip.description].some(
      (text) => text.toLocaleLowerCase("id").includes(needle),
    ))
  );
}

export function buildTripInquiryMessage(
  trip: TripDestination,
  routeId: string,
  origin: string,
): string {
  const chosen = trip.routes?.find((route) => route.id === routeId && route.active);
  const routeLabel = chosen ? chosen.name : "Belum ditentukan, ingin konsultasi";
  const link = `${origin.replace(/\/$/, "")}/catalog/${encodeURIComponent(trip.slug)}`;
  return [
    "Halo Admin E-GOTO, saya ingin bertanya tentang trip:",
    "",
    `Trip: ${trip.name}`,
    ...(trip.location ? [`Lokasi: ${trip.location}`] : []),
    ...(trip.routes?.some((route) => route.active) ? [`Pilihan jalur: ${routeLabel}`] : []),
    "",
    "Mohon info ketersediaan, pilihan jalur, jadwal, itinerary, dan harga terbaru.",
    `Detail: ${link}`,
  ].join("\n");
}

/** Inquiry-only trips are visible publicly but are never voucher-eligible. */
export function isBookableTrip(trip: TripDestination): boolean {
  return trip.prices.some((price) => Number.isSafeInteger(price.amount) && price.amount > 0) &&
    trip.schedules.some((schedule) =>
      schedule.publicationStatus === "published" &&
      schedule.availabilityStatus === "available"
    );
}
