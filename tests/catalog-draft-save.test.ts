import { describe, expect, it } from "vitest";
import { destinations } from "@/data/catalog";
import { normalizeDestination, nextUnusedScheduleDate } from "@/lib/catalog-utils";
import { parseDestinationPayload } from "@/lib/validation";
import { getInitialCatalogEditorMonth } from "@/lib/catalog-editor-month";

describe("Catalog Save draft regression", () => {
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
