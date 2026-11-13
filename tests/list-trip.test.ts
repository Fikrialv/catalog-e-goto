import { describe, expect, it } from "vitest";
import { clone, normalizeDestination } from "@/lib/catalog-utils";
import { destinations } from "@/data/catalog";
import {
  categoriesForTrip,
  filterListTrips,
  buildTripInquiryMessage,
  normalizeTripCategories,
  isBookableTrip,
} from "@/lib/list-trip";
import { parseDestinationPayload } from "@/lib/validation";

const trip = () => ({
  ...clone(destinations[0]),
  id: "rinjani",
  name: "Gunung Rinjani",
  slug: "rinjani",
  category: "mountain" as const,
  categories: ["mountain", "lintas"],
  routes: [
    { id: "sembalun", name: "Via Sembalun", description: "", active: true },
    { id: "torean", name: "Via Torean", description: "", active: true },
  ],
});

describe("list trip discovery", () => {
  it("filters one destination by each of its categories without duplication", () => {
    const source = [trip(), {...trip(), id:"bromo",name:"Gunung Bromo",slug:"bromo",categories:["mountain"]}];
    expect(filterListTrips(source, "lintas", "")).toHaveLength(1);
    expect(filterListTrips(source, "mountain", "")).toHaveLength(2);
    expect(filterListTrips(source, "all", "rinjani")).toHaveLength(1);
    expect(filterListTrips(source, "all", "").map(x=>x.id)).toEqual(["rinjani","bromo"]);
  });

  it("renders the existing published beach_waterfall trip without crashing homepage", () => {
    const existing = destinations.find((item) => item.category === "beach_waterfall");
    expect(existing).toBeDefined();
    if (!existing) throw new Error("Legacy published category fixture missing");
    expect(() => parseDestinationPayload(existing)).not.toThrow();
    expect(() => normalizeDestination(existing, "published")).not.toThrow();
  });

  it("keeps legacy categories accessible without migrations to old payloads", () => {
    const legacy = {...trip(),categories: undefined};
    expect(categoriesForTrip(legacy)).toEqual(["mountain"]);
    expect(normalizeTripCategories(["mountain","mountain","lintas"])).toEqual(["mountain","lintas"]);
  });

  it("builds inquiry including route but without claiming price, quota or available dates", () => {
    const message = buildTripInquiryMessage(trip(), "sembalun", "https://e-goto.my.id");
    expect(message).toContain("Gunung Rinjani");
    expect(message).toContain("Via Sembalun");
    expect(message).toContain("https://e-goto.my.id");
    expect(message).not.toMatch(/Harga final|Tersedia sekarang|Rp\s*\d/i);
  });

  it("accepts published inquiry trips without a scheduled departure or price", () => {
    const source=trip();
    source.schedules=[];
    source.prices=[];
    source.highlights=[];
    source.publicationStatus="published";
    expect(()=>parseDestinationPayload(source)).not.toThrow();
  });

  it("allows an image-less draft but blocks publishing without a real cover", () => {
    const draft = trip();
    draft.coverImage.src = "";
    draft.publicationStatus = "draft";
    expect(()=>parseDestinationPayload(draft)).not.toThrow();
    draft.publicationStatus = "published";
    expect(()=>parseDestinationPayload(draft)).toThrow();
  });

  it("prevents vouchers for inquiry-only trips without bookable schedules/prices", () => {
    const source = trip();
    expect(isBookableTrip(source)).toBe(true);
    expect(isBookableTrip({ ...source, schedules: [], prices: [] })).toBe(false);
    expect(isBookableTrip({ ...source, schedules: source.schedules.map((schedule) => ({
      ...schedule, publicationStatus: "draft",
    })) })).toBe(false);
  });

  it("rejects invalid category slugs and duplicate route names", () => {
    const source=trip();
    expect(()=>parseDestinationPayload({...source,categories:["mountain","INVALID NAME"]})).toThrow();
    expect(()=>parseDestinationPayload({...source,routes:[
      { id:"one", name:"Via Sembalun", active:true, description:"" },
      { id:"two", name:"Via Sembalun", active:true, description:"" },
    ]})).toThrow();
  });
});
