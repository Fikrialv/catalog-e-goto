import { describe, expect, it } from "vitest";
import { destinations } from "@/data/catalog";
import {
  getCatalogMonthsFromDestinations,
  getMonthlyDestinationsFromDestinations,
} from "@/services/catalog";

describe("E-GOTO UI catalog data", () => {
  it("keeps CMC departures inside the two active catalog months", () => {
    const cmc = destinations.find(
      (destination) => destination.slug === "cmc-pantai-3-warna-tumpak-sewu",
    );
    expect(
      cmc?.schedules.map((schedule) => [schedule.startDate, schedule.endDate]),
    ).toEqual([
      ["2026-10-10", "2026-10-11"],
      ["2026-10-24", "2026-10-25"],
      ["2026-11-14", "2026-11-15"],
      ["2026-11-28", "2026-11-29"],
    ]);
  });

  it("shows monthly inventory only for published departures", async () => {
    expect(
      getMonthlyDestinationsFromDestinations(destinations, { monthKey: "2026-10" }).map(
        (destination) => destination.slug,
      ),
    ).toHaveLength(5);
    expect(getMonthlyDestinationsFromDestinations(destinations, { monthKey: "2026-12" })).toEqual([]);
  });

  it("filters the prototype catalog by category and search", async () => {
    expect(
      getMonthlyDestinationsFromDestinations(destinations, {
        monthKey: "2026-11",
        category: "mountain",
      }),
    ).toHaveLength(4);
    expect(
      getMonthlyDestinationsFromDestinations(destinations, { monthKey: "2026-11", search: "CMC" })
        .length,
    ).toBe(1);
  });

  it("lists every month that has a published departure", () => {
    const withDecember = structuredClone(destinations);
    withDecember[0].schedules.push({
      ...withDecember[0].schedules[0],
      id: "thekelan-2026-12-12",
      startDate: "2026-12-12",
      endDate: "2026-12-14",
    });

    expect(
      getCatalogMonthsFromDestinations(withDecember).map((month) => month.key),
    ).toEqual(["2026-10", "2026-11", "2026-12"]);
  });

  it("does not expose unpublished schedules in public month data", async () => {
    const withDraft = structuredClone(destinations);
    withDraft[0].schedules.push({
      ...withDraft[0].schedules[0],
      id: "thekelan-draft-2026-12-12",
      startDate: "2026-12-12",
      endDate: "2026-12-14",
      publicationStatus: "draft",
    });

    expect(
      getCatalogMonthsFromDestinations(withDraft).map((month) => month.key),
    ).not.toContain("2026-12");
    expect(
      getMonthlyDestinationsFromDestinations(withDraft, {
        monthKey: "2026-12",
      }),
    ).toEqual([]);
  });
});
