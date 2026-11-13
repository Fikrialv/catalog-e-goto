import { describe,expect,it } from "vitest";
import { newListTrip,parseListTrip } from "@/lib/list-trip-validation";
import { buildTripInquiryMessage,filterListTrips,publicCategoryNamesForTrip } from "@/lib/list-trip";
import type { TripCategory } from "@/types/catalog";

describe("independent List Trip CRUD data",()=>{
  it("creates an inquiry-only draft without Catalog schedules, prices or promotions",()=>{
    const draft=newListTrip(new Date("2026-11-14T00:00:00.000Z"));
    expect(parseListTrip(draft).publicationStatus).toBe("draft");
    expect(Object.hasOwn(draft,"schedules")).toBe(false);
    expect(Object.hasOwn(draft,"prices")).toBe(false);
    expect(Object.hasOwn(draft,"highlights")).toBe(false);
  });
  it("requires a cover when publishing, but never a Catalog date",()=>{
    const draft=newListTrip();
    expect(()=>parseListTrip({...draft,publicationStatus:"published"})).toThrow();
    expect(parseListTrip({...draft,publicationStatus:"published",coverImage:{src:"/trip.jpg",alt:"Tampilan trip",sortOrder:1}}).publicationStatus).toBe("published");
  });
  it("supports multiple categories and named inquiry routes",()=>{
    const trip={
      ...newListTrip(),name:"Rinjani",location:"Lombok",
      categories:["mountain","camping"],category:"mountain",
      routes:[{id:"jalur-1",name:"Via Sembalun",description:"Rute utama",active:true}],
    };
    expect(filterListTrips([trip],"camping","rinjani")).toHaveLength(1);
    expect(buildTripInquiryMessage(trip,"jalur-1","https://e-goto.my.id")).toContain("Via Sembalun");
    expect(buildTripInquiryMessage(trip,"jalur-1","https://e-goto.my.id")).toContain("https://e-goto.my.id/trips");
    const categories:TripCategory[]=[
      {id:"mountain",slug:"mountain",name:"Gunung",sortOrder:1,isActive:true},
      {id:"camping",slug:"camping",name:"Camping",sortOrder:2,isActive:true},
    ];
    expect(publicCategoryNamesForTrip(trip,categories)).toBe("Gunung · Camping");
  });
});
