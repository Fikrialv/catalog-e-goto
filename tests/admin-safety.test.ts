import { describe, expect, it } from "vitest";
import {
  nextUnusedScheduleDate,
  moveScheduleEndDate,
  slugForDraftSave,
} from "@/lib/catalog-utils";
import type { DepartureSchedule } from "@/types/catalog";

const schedule = (startDate: string, endDate: string | null = null): DepartureSchedule => ({
  id: startDate,
  startDate,
  endDate,
  publicationStatus: "draft",
  availabilityStatus: "available",
});

describe("safe trip editing", () => {
  it("preserves the active public slug until Publish", () => {
    expect(slugForDraftSave("published", "trip-original", "trip-baru")).toBe("trip-original");
    expect(slugForDraftSave("draft", "trip-original", "trip-baru")).toBe("trip-baru");
  });

  it("chooses a free date when duplicating instead of silently hiding the row", () => {
    const existing = [schedule("2026-11-07", "2026-11-08")];
    expect(nextUnusedScheduleDate(existing, "2026-11", "2026-11-07"))
      .toBe("2026-11-08");
    expect(moveScheduleEndDate("2026-11-07", "2026-11-08", "2026-11-08"))
      .toBe("2026-11-09");
  });

  it("preserves multi-day travel duration across month and year boundaries", () => {
    expect(moveScheduleEndDate("2026-10-30", "2026-11-01", "2026-12-31"))
      .toBe("2027-01-02");
    expect(moveScheduleEndDate("2026-10-30", null, "2026-12-31")).toBeNull();
  });

  it("correctly computes leap-year month days and handles a full month", () => {
    const february = Array.from({ length: 29 }, (_, i) =>
      schedule(`2028-02-${String(i + 1).padStart(2, "0")}`));
    expect(nextUnusedScheduleDate(february, "2028-02")).toBeNull();
    expect(nextUnusedScheduleDate(february.slice(0, -1), "2028-02"))
      .toBe("2028-02-29");
  });
});
