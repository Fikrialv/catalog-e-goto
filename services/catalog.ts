import type { Category, TripDestination } from "@/types/catalog";
import { formatMonthLabel } from "@/lib/format";
import { monthKeyFromDate } from "@/lib/catalog-utils";
import { compareDestinationsByDeparture } from "@/lib/catalog-utils";
import { unstable_cache } from "next/cache";
import {
  getPublicCatalogRepository,
} from "@/services/catalog-repository";

const getCachedPublishedDestinations = unstable_cache(
  async () => getPublicCatalogRepository().listPublic(),
  ["egoto-public-catalog"],
  { revalidate: 30, tags: ["egoto-public-catalog"] },
);

export async function getPublishedDestinations(): Promise<TripDestination[]> {
  return getCachedPublishedDestinations();
}

export async function getDestinationBySlug(
  slug: string,
): Promise<TripDestination | undefined> {
  return getPublicCatalogRepository().getPublicBySlug(slug);
}

export async function getMonthlyDestinations({
  monthKey,
  category,
  search,
  duration,
}: {
  monthKey: string;
  category?: Category | "all";
  search?: string;
  duration?: string;
}): Promise<TripDestination[]> {
  return getMonthlyDestinationsFromDestinations(
    await getPublishedDestinations(),
    { monthKey, category, search, duration },
  );
}

export function getMonthlyDestinationsFromDestinations(
  destinations: TripDestination[],
  {
    monthKey,
    category,
    search,
    duration,
  }: {
    monthKey: string;
    category?: Category | "all";
    search?: string;
    duration?: string;
  },
) {
  const normalizedSearch = search?.trim().toLowerCase();

  return destinations
    .filter((destination) => {
      const monthSchedules = destination.schedules.filter(
        (schedule) =>
          schedule.publicationStatus === "published" &&
          monthKeyFromDate(schedule.startDate) === monthKey,
      );
      const matchesCategory =
        !category || category === "all" || destination.category === category;
      const matchesSearch =
        !normalizedSearch ||
        destination.name.toLowerCase().includes(normalizedSearch);
      const matchesDuration =
        !duration ||
        duration === "all" ||
        destination.duration.startsWith(duration);
      return (
        monthSchedules.length > 0 &&
        matchesCategory &&
        matchesSearch &&
        matchesDuration
      );
    })
    .map((destination) => ({
      ...destination,
      schedules: destination.schedules.filter(
        (schedule) =>
          schedule.publicationStatus === "published" &&
          monthKeyFromDate(schedule.startDate) === monthKey,
      ),
    }))
    .sort(compareDestinationsByDeparture);
}

export function getCatalogMonthsFromDestinations(
  destinations: TripDestination[],
) {
  const keys = new Set(
    destinations.flatMap((destination) =>
      destination.schedules
        .filter((schedule) => schedule.publicationStatus === "published")
        .map((schedule) => monthKeyFromDate(schedule.startDate)),
    ),
  );
  return [...keys].sort().map((key) => ({ key, label: formatMonthLabel(key) }));
}

export async function getCatalogMonths() {
  return getCatalogMonthsFromDestinations(await getPublishedDestinations());
}
