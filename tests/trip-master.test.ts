import { describe, expect, it } from "vitest";
import { createBlankMasterTrip } from "@/lib/trip-drafts";
import { publicCategoryNamesForTrip } from "@/lib/list-trip";
import { parseDestinationPayload } from "@/lib/validation";
import type { TripCategory } from "@/types/catalog";

const categories: TripCategory[] = [
  { id: "mountain", slug: "mountain", name: "Gunung", sortOrder: 1, isActive: true },
  { id: "beach", slug: "beach", name: "Pantai", sortOrder: 2, isActive: true },
  { id: "waterfall", slug: "waterfall", name: "Air Terjun", sortOrder: 3, isActive: true },
];

describe("master List Trip inventory", () => {
  it("creates an independent trip with no automatic catalog schedule or price", () => {
    const trip = createBlankMasterTrip(new Date("2026-11-14T00:00:00.000Z"));
    expect(trip.schedules).toEqual([]);
    expect(trip.prices).toEqual([]);
    expect(trip.routes).toEqual([]);
    expect(trip.publicationStatus).toBe("draft");
    expect(() => parseDestinationPayload(trip)).not.toThrow();
  });

  it("allows routes on a published inquiry-only trip", () => {
    const trip = createBlankMasterTrip(new Date("2026-11-14T00:00:00.000Z"));
    trip.coverImage.src = "https://example.com/cover.jpg";
    trip.routes = [
      { id: "sembalun", name: "Via Sembalun", description: "Jalur timur", active: true },
      { id: "torean", name: "Via Torean", description: "Jalur utara", active: true },
    ];
    trip.publicationStatus = "published";
    expect(() => parseDestinationPayload(trip)).not.toThrow();
    expect(trip.schedules).toHaveLength(0);
  });

  it("shows full category names instead of misleading 'Pantai +1'", () => {
    expect(publicCategoryNamesForTrip({ category: "beach_waterfall" }, categories))
      .toBe("Pantai · Air Terjun");
    expect(publicCategoryNamesForTrip({ category: "beach", categories: ["beach"] }, categories))
      .toBe("Pantai");
    expect(publicCategoryNamesForTrip({ category: "mountain", categories: ["mountain", "waterfall"] }, categories))
      .toBe("Gunung · Air Terjun");
  });
});
