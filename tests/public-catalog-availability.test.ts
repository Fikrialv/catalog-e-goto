import { describe, expect, it } from "vitest";
import { destinations } from "@/data/catalog";
import { filterListTrips } from "@/lib/list-trip";
import { isUpcomingAvailableSchedule, upcomingCatalogMonths } from "@/lib/catalog-utils";
import { getCatalogMonthsFromDestinations, getMonthlyDestinationsFromDestinations } from "@/services/catalog";

const today = "2026-11-13";

function sample() {
  const trip = structuredClone(destinations[0]);
  trip.publicationStatus = "published";
  trip.schedules = [{
    id: "future-open", startDate: "2026-11-20", endDate: "2026-11-22",
    publicationStatus: "published", availabilityStatus: "available",
  }];
  trip.highlights = [];
  return trip;
}

describe("separated List Trip and scheduled Catalog", () => {
  it("makes every upcoming month selectable, even without trips, including year rollover", () => {
    expect(upcomingCatalogMonths("2026-11-14").slice(0, 3)).toEqual(["2026-11", "2026-12", "2027-01"]);
    const trip = sample();
    const months = getCatalogMonthsFromDestinations([trip], "2026-11-14");
    expect(months.find((m) => m.key === "2026-12")).toBeDefined();
    expect(getMonthlyDestinationsFromDestinations([trip], {monthKey: "2026-12"}, "2026-11-14")).toEqual([]);
    expect(getMonthlyDestinationsFromDestinations([trip], {monthKey: "2026-11"}, "2026-11-14")).toHaveLength(1);
  });

  it("retains published inquiry trips in List Trip even without departures", () => {
    const inquiry = sample();
    inquiry.schedules = [];
    inquiry.prices = [];
    expect(filterListTrips([inquiry], "all", "")).toHaveLength(1);
    expect(getCatalogMonthsFromDestinations([inquiry], today).map((m) => m.key).slice(0, 2)).toEqual(["2026-11", "2026-12"]);
  });

  it("shows only upcoming published available schedules", () => {
    const trip = sample();
    trip.schedules.push(
      { id: "past", startDate: "2026-10-01", endDate: "2026-10-03", publicationStatus: "published", availabilityStatus: "available" },
      { id: "full", startDate: "2026-11-21", endDate: "2026-11-23", publicationStatus: "published", availabilityStatus: "full" },
      { id: "closed", startDate: "2026-11-22", endDate: "2026-11-24", publicationStatus: "published", availabilityStatus: "closed" },
      { id: "cancelled", startDate: "2026-11-23", endDate: "2026-11-25", publicationStatus: "published", availabilityStatus: "cancelled" },
      { id: "draft", startDate: "2026-11-24", endDate: "2026-11-26", publicationStatus: "draft", availabilityStatus: "available" },
    );
    expect(getCatalogMonthsFromDestinations([trip], today).map((m) => m.key).slice(0, 2)).toEqual(["2026-11", "2026-12"]);
    const published = getMonthlyDestinationsFromDestinations([trip], {monthKey:"2026-11"}, today);
    expect(published).toHaveLength(1);
    expect(published[0].schedules.map((schedule) => schedule.id)).toEqual(["future-open"]);
    expect(getMonthlyDestinationsFromDestinations([trip], {monthKey:"2026-10"}, today)).toEqual([]);
    expect(isUpcomingAvailableSchedule(trip.schedules[0], today)).toBe(true);
    expect(isUpcomingAvailableSchedule(trip.schedules[1], today)).toBe(false);
  });

  it("matches legacy and multi-category tags on schedule catalog", () => {
    const beach = {...sample(), id:"beach", category:"beach_waterfall", categories: undefined};
    expect(getMonthlyDestinationsFromDestinations([beach], {monthKey:"2026-11",category:"beach"},today)).toHaveLength(1);
    expect(getMonthlyDestinationsFromDestinations([beach], {monthKey:"2026-11",category:"waterfall"},today)).toHaveLength(1);
    expect(getMonthlyDestinationsFromDestinations([beach], {monthKey:"2026-11",category:"mountain"},today)).toHaveLength(0);
  });

  it("hides unpublished destinations from scheduled catalog even when schedule is available", () => {
    const draft = sample();
    draft.publicationStatus = "draft";
    expect(getCatalogMonthsFromDestinations([draft], today).map((m) => m.key).slice(0, 2)).toEqual(["2026-11", "2026-12"]);
    expect(getMonthlyDestinationsFromDestinations([draft], {monthKey:"2026-11"}, today)).toEqual([]);
  });
});
