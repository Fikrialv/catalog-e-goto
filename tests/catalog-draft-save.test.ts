import { describe, expect, it } from "vitest";
import { destinations } from "@/data/catalog";
import { normalizeDestination, nextUnusedScheduleDate, moveScheduleEndDate } from "@/lib/catalog-utils";
import { parseDestinationPayload, catalogSaveErrorMessage } from "@/lib/validation";
import { getInitialCatalogEditorMonth } from "@/lib/catalog-editor-month";
import { assertCatalogDraftVersion, CATALOG_CONFLICT_MESSAGE } from "@/lib/catalog-draft-concurrency";
import { catalogDuplicateIdentity } from "@/lib/catalog-duplicate";

describe("Catalog Save draft regression", () => {
  it("gives repeated duplicate actions unique IDs and URL slugs", () => {
    const first = catalogDuplicateIdentity("gunung-rinjani", "abc12345");
    const second = catalogDuplicateIdentity("gunung-rinjani", "def67890");
    expect(first.slug).not.toBe(second.slug);
    expect(first.id).not.toBe(second.id);
    expect(first.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(catalogDuplicateIdentity("a".repeat(115), "abc12345").slug.length).toBeLessThanOrEqual(120);
  });

  it("rejects a stale draft version before one admin overwrites another admin", () => {
    expect(() => assertCatalogDraftVersion(8, 7)).toThrow(CATALOG_CONFLICT_MESSAGE);
    expect(() => assertCatalogDraftVersion(8, 8)).not.toThrow();
    expect(() => assertCatalogDraftVersion(8, undefined)).toThrow(CATALOG_CONFLICT_MESSAGE);
  });
  it("accepts a draft payload after switching a departure to another month", () => {
    const trip = structuredClone(destinations[0]);
    trip.schedules[0] = {
      ...trip.schedules[0],
      startDate: "2027-01-16",
      endDate: "2027-01-17",
    };
    const normalized = normalizeDestination(trip, "draft");
    expect(parseDestinationPayload(normalized).schedules[0].startDate).toBe("2027-01-16");
    // The database must accept this shape without requiring legacy root sortOrder.
    expect(Object.hasOwn(normalized, "sortOrder")).toBe(false);
  });

  it("saves a draft with a newly added unfinished price and gallery slot", () => {
    const trip = structuredClone(destinations[0]);
    trip.prices.push({ id: "new-price", label: "Meeting point baru", amount: 0, sortOrder: trip.prices.length + 1 });
    trip.gallery.push({ src: "", alt: "", sortOrder: trip.gallery.length + 1 });
    const draft = normalizeDestination(trip, "draft");
    expect(draft.prices.at(-1)?.amount).toBe(0);
    expect(draft.gallery.at(-1)?.src).toBe("");
    expect(() => normalizeDestination(draft, "published")).toThrow();
  });

  it("rejects invalid negative or incomplete published price data", () => {
    const trip = structuredClone(destinations[0]);
    trip.prices[0].amount = -1;
    expect(() => normalizeDestination(trip, "draft")).toThrow();
    trip.prices[0].amount = 0;
    expect(() => normalizeDestination(trip, "draft")).not.toThrow();
    expect(() => normalizeDestination(trip, "published")).toThrow();
  });

  it("preserves departure duration when moved across months", () => {
    expect(moveScheduleEndDate("2026-11-28", "2026-11-29", "2027-01-16")).toBe("2027-01-17");
    expect(moveScheduleEndDate("2026-11-28", null, "2027-01-16")).toBe(null);
    const trip = structuredClone(destinations[0]);
    trip.schedules[0] = {
      ...trip.schedules[0],
      startDate: "2027-01-16",
      endDate: moveScheduleEndDate(trip.schedules[0].startDate, trip.schedules[0].endDate, "2027-01-16"),
    };
    expect(() => normalizeDestination(trip,"draft")).not.toThrow();
  });

  it("returns a readable field-level error instead of raw validation JSON", () => {
    const trip = structuredClone(destinations[0]);
    trip.schedules[0].endDate = "2025-01-01";
    let thrown: unknown;
    try { parseDestinationPayload(trip); } catch (error) { thrown = error; }
    expect(catalogSaveErrorMessage(thrown)).toContain("Periksa schedules");
    expect(catalogSaveErrorMessage(thrown)).toContain("End date");
  });

  it("uses the selected month from the admin schedule list, not the first trip departure", () => {
    const schedules = destinations[0].schedules;
    expect(getInitialCatalogEditorMonth("2027-01", schedules, "2026-11")).toBe("2027-01");
    expect(getInitialCatalogEditorMonth("2027-13", schedules, "2026-11")).toBe(schedules[0].startDate.slice(0,7));
    expect(getInitialCatalogEditorMonth(undefined, [], "2026-11")).toBe("2026-11");
  });

  it("keeps schedules in their own month and does not invent duplicate dates", () => {
    const schedules = [{...destinations[0].schedules[0], startDate:"2027-01-01", endDate:null}];
    expect(nextUnusedScheduleDate(schedules, "2027-01")).toBe("2027-01-02");
    expect(nextUnusedScheduleDate(schedules, "2027-02")).toBe("2027-02-01");
  });
});
