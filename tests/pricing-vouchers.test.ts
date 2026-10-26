import { describe, expect, it } from "vitest";
import { clone } from "@/lib/catalog-utils";
import { getTripPriceBreakdown } from "@/lib/pricing";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { parseDestinationPayload } from "@/lib/validation";
import { redeemVoucherSchema } from "@/lib/voucher-validation";
import { destinations } from "@/data/catalog";

function fixture() {
  const trip = clone(destinations[0]);
  const [october, november] = trip.schedules;
  trip.schedules = [
    { ...october, id: "oct-10", startDate: "2026-10-10", endDate: "2026-10-11", publicationStatus: "published", availabilityStatus: "available" },
    { ...(november ?? october), id: "nov-07", startDate: "2026-11-07", endDate: "2026-11-08", publicationStatus: "published", availabilityStatus: "available" },
  ];
  const normal = trip.prices[0];
  trip.highlights = [{
    id: "promo-oct",
    enabled: true,
    label: "Promo khusus 10 Oktober",
    scheduleId: "oct-10",
    priceId: normal.id,
    discountType: "fixed",
    discountValue: 50000,
    discountAmount: normal.amount - 50000,
  }];
  return trip;
}

describe("date scoped promotion and voucher pricing", () => {
  it("discounts only the selected departure date, not other departure dates", () => {
    const trip = fixture();
    const priceId = trip.prices[0].id;
    const promo = getTripPriceBreakdown(trip, "oct-10", priceId);
    const regular = getTripPriceBreakdown(trip, "nov-07", priceId);
    expect(promo.promotionDiscount).toBe(50000);
    expect(promo.finalPrice).toBe(trip.prices[0].amount - 50000);
    expect(regular.promotionDiscount).toBe(0);
    expect(regular.finalPrice).toBe(trip.prices[0].amount);
  });

  it("stacks voucher after applicable date discount without going negative", () => {
    const trip = fixture();
    const priceId = trip.prices[0].id;
    const result = getTripPriceBreakdown(trip, "oct-10", priceId, 25000);
    expect(result.finalPrice).toBe(trip.prices[0].amount - 75000);
    expect(result.voucherDiscount).toBe(25000);
    expect(result.afterPromotion).toBe(trip.prices[0].amount - 50000);
    expect(getTripPriceBreakdown(trip, "nov-07", priceId, 25000).finalPrice)
      .toBe(trip.prices[0].amount - 25000);
  });

  it("prevents a voucher from being applied to a draft schedule", () => {
    const trip = fixture();
    trip.schedules[0].publicationStatus = "draft";
    expect(() =>
      getTripPriceBreakdown(trip, "oct-10", trip.prices[0].id, 25000)
    ).toThrow("Tanggal trip tidak tersedia");
  });

  it("ignores disabled, unrelated and unpublished highlights", () => {
    const trip = fixture();
    trip.highlights[0].enabled = false;
    expect(getTripPriceBreakdown(trip, "oct-10", trip.prices[0].id).promotionDiscount).toBe(0);
    trip.highlights[0].enabled = true;
    trip.schedules[0].publicationStatus = "draft";
    expect(() => getTripPriceBreakdown(trip, "oct-10", trip.prices[0].id)).toThrow();
  });

  it("rejects invalid, unavailable or missing departure IDs", () => {
    const trip = fixture();
    expect(() => getTripPriceBreakdown(trip, "not-found", trip.prices[0].id)).toThrow();
    trip.schedules[0].availabilityStatus = "full";
    expect(() => getTripPriceBreakdown(trip, "oct-10", trip.prices[0].id)).toThrow();
  });

  it("puts normal, promo, voucher and final values in the WhatsApp inquiry", () => {
    const trip = fixture();
    const price = trip.prices[0];
    const pricing = getTripPriceBreakdown(trip, "oct-10", price.id, 25000);
    const message = buildWhatsAppMessage(
      trip,
      "10–11 Oktober 2026",
      { ...price, amount: pricing.finalPrice },
      "redemption-reference",
      25000,
      pricing,
    );
    expect(message).toContain("Harga normal:");
    expect(message).toContain("Diskon tanggal:");
    expect(message).toContain("Potongan voucher:");
    expect(message).toContain("Harga final:");
    expect(message).toContain("10–11 Oktober 2026");
  });

  it("never applies a voucher amount larger than the selected post-promo price", () => {
    const trip = fixture();
    const result = getTripPriceBreakdown(trip, "oct-10", trip.prices[0].id, 99999999);
    expect(result.finalPrice).toBe(0);
    expect(result.voucherDiscount).toBe(result.afterPromotion);
  });

  it("requires a selected schedule when redeeming a voucher", () => {
    const input = {
      code: "EGOTO-TEST",
      destinationSlug: "tumpak-sewu",
      priceId: "price-1",
      sessionId: "01234567-89ab-4cde-8fab-0123456789ab",
    };
    expect(redeemVoucherSchema.safeParse(input).success).toBe(false);
    expect(redeemVoucherSchema.safeParse({...input, scheduleId: "oct-10"}).success).toBe(true);
  });
});

describe("real calendar date validation", () => {
  it("rejects February 30 and a nonexistent leap day", () => {
    const trip = fixture();
    trip.highlights = [];
    trip.schedules[0].startDate = "2026-02-30";
    expect(() => parseDestinationPayload(trip)).toThrow();
    trip.schedules[0].startDate = "2027-02-29";
    expect(() => parseDestinationPayload(trip)).toThrow();
  });

  it("requires at least one published departure before publication", () => {
    const trip = fixture();
    trip.highlights = [];
    trip.publicationStatus = "published";
    trip.schedules = trip.schedules.map((schedule) => ({
      ...schedule,
      publicationStatus: "draft",
    }));
    expect(() => parseDestinationPayload(trip)).toThrow();
  });

  it("accepts valid leap dates and year-crossing departures", () => {
    const trip = fixture();
    trip.highlights = [];
    trip.schedules[0].startDate = "2028-02-29";
    trip.schedules[0].endDate = "2028-03-01";
    expect(() => parseDestinationPayload(trip)).not.toThrow();
  });
});
