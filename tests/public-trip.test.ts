import { describe, expect, it, vi } from "vitest";
import { destinations } from "@/data/catalog";
import { safePublicTrip } from "@/lib/public-trip";

describe("public homepage resilience", () => {
  it("accepts published legacy category payloads", () => {
    const existing = destinations.find((trip) => trip.category === "beach_waterfall");
    expect(existing).toBeDefined();
    expect(safePublicTrip(existing)).toMatchObject({
      category: "beach_waterfall",
      publicationStatus: "published",
    });
  });

  it("ignores a malformed published entry instead of crashing the entire homepage", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(safePublicTrip({id:"bad-trip",slug:"bad-trip",name:"Bad",schedules:"not-an-array"})).toBeNull();
      expect(spy).toHaveBeenCalledOnce();
    } finally {
      spy.mockRestore();
    }
  });
});
