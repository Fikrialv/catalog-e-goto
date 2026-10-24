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

/** Keep public URLs stable while an editor modifies a published draft. */
export function slugForDraftSave(
  status: CatalogRecord["status"],
  currentSlug: string,
  draftSlug: string,
) {
  return status === "published" ? currentSlug : draftSlug;
}

/** Return a free departure day in the target month, or null when full. */
export function nextUnusedScheduleDate(
  schedules: TripDestination["schedules"],
  monthKey: string,
  startAfter?: string,
): string | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) return null;
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const taken = new Set(schedules.map((schedule) => schedule.startDate));
  const candidates = Array.from({ length: lastDay }, (_, index) =>
    `${monthKey}-${String(index + 1).padStart(2, "0")}`);
  return candidates.find((date) => (startAfter ? date > startAfter : true) && !taken.has(date))
    ?? candidates.find((date) => !taken.has(date))
    ?? null;
}

/** Preserve number of travel days when duplicating a departure. */
export function moveScheduleEndDate(
  oldStart: string,
  oldEnd: string | null,
  newStart: string,
): string | null {
  if (!oldEnd) return null;
  const original = Date.parse(`${oldStart}T00:00:00Z`);
  const finish = Date.parse(`${oldEnd}T00:00:00Z`);
  const next = Date.parse(`${newStart}T00:00:00Z`);
  if (![original, finish, next].every(Number.isFinite) || finish < original) return null;
  return new Date(next + finish - original).toISOString().slice(0, 10);
}
