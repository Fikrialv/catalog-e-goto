import type {
  CatalogRecord,
  HighlightOffer,
  PriceOption,
  TripDestination,
} from "@/types/catalog";
import { parseDestinationPayload } from "@/lib/validation";

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function nowIso() {
  return new Date().toISOString();
}

export function monthKeyFromDate(startDate: string) {
  return startDate.slice(0, 7);
}

export function getDestinationHighlights(
  destination: TripDestination,
): HighlightOffer[] {
  return destination.highlights.filter((offer) => offer.enabled);
}

export function getHighlightSchedule(
  destination: TripDestination,
  offer: HighlightOffer,
) {
  return destination.schedules.find(
    (schedule) => schedule.id === offer.scheduleId,
  );
}

export function getMonthlyHighlights(
  destination: TripDestination,
  monthKey: string,
) {
  return getDestinationHighlights(destination).filter((offer) => {
    const schedule = getHighlightSchedule(destination, offer);
    return schedule ? monthKeyFromDate(schedule.startDate) === monthKey : false;
  });
}

export function getDiscountedPriceAmount(
  price: PriceOption,
  offer: HighlightOffer,
) {
  if (offer.discountType === "percentage" && offer.discountValue) {
    return roundRupiah(price.amount * (1 - offer.discountValue / 100));
  }
  if (offer.discountType === "fixed" && offer.discountValue) {
    return Math.max(0, price.amount - offer.discountValue);
  }
  return price.id === offer.priceId ? offer.discountAmount : price.amount;
}

export function appliesToAllDeparturePoints(offer: HighlightOffer) {
  return Boolean(offer.discountType && offer.discountValue);
}

export function roundRupiah(amount: number) {
  return Math.round(Math.max(0, amount) / 1000) * 1000;
}

export function compareDestinationsByDeparture(
  left: TripDestination,
  right: TripDestination,
) {
  const first = (destination: TripDestination) =>
    destination.schedules
      .filter((schedule) => schedule.publicationStatus === "published")
      .map((schedule) => schedule.startDate)
      .sort()[0] ?? "9999-12-31";
  return (
    first(left).localeCompare(first(right)) ||
    left.name.localeCompare(right.name, "id")
  );
}

export function normalizeDestination(
  payload: TripDestination,
  status: TripDestination["publicationStatus"],
): TripDestination {
  const normalized = clone(parseDestinationPayload(payload));
  normalized.publicationStatus = status;
  normalized.updatedAt = normalized.updatedAt || nowIso();
  normalized.prices = normalized.prices.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
  normalized.schedules = normalized.schedules.map((item, index) => ({
    ...item,
    destinationId: normalized.id,
    id: item.id || `${normalized.id}-schedule-${index + 1}`,
    createdAt: item.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  }));
  normalized.highlights = normalized.highlights.map((offer, index) => ({
    ...offer,
    id: offer.id || `${normalized.id}-highlight-${index + 1}`,
    discountAmount: roundRupiah(offer.discountAmount),
  }));
  normalized.itinerary = normalized.itinerary.map((day, dayIndex) => ({
    ...day,
    sortOrder: dayIndex + 1,
    dayNumber: dayIndex + 1,
    items: day.items.map((item, itemIndex) => ({
      ...item,
      sortOrder: itemIndex + 1,
    })),
  }));
  return parseDestinationPayload(normalized);
}

export function createChangeSummary(
  before: TripDestination | null,
  after: TripDestination,
) {
  if (!before)
    return [
      { type: "added", field: "destination", before: null, after: after.name },
    ];
  const fields: Array<keyof TripDestination> = [
    "name",
    "slug",
    "category",
    "duration",
    "description",
    "prices",
    "schedules",
    "itinerary",
    "highlights",
    "includes",
    "excludes",
    "notes",
    "coverImage",
    "gallery",
  ];
  return fields.flatMap((field) => {
    const previous = JSON.stringify(before[field]);
    const next = JSON.stringify(after[field]);
    if (previous === next) return [];
    return [
      { type: "changed", field, before: before[field], after: after[field] },
    ];
  });
}

export function toPublicDestination(record: CatalogRecord) {
  if (record.status !== "published" || !record.published) return null;
  const payload = normalizeDestination(record.published, "published");
  return {
    ...payload,
    publishedAt: record.publishedAt,
    publishedVersion: record.publishedVersion,
    schedules: payload.schedules.filter(
      (schedule) => schedule.publicationStatus === "published",
    ),
  } satisfies TripDestination;
}
