import type { HighlightOffer, TripDestination } from "@/types/catalog";
import { getDiscountedPriceAmount } from "@/lib/catalog-utils";

/**
 * Pricing is departure-specific. A promotional offer never applies to another
 * schedule merely because it belongs to the same trip/month.
 */
export function getApplicablePromotion(
  destination: TripDestination,
  scheduleId: string,
  priceId: string,
): HighlightOffer | null {
  const schedule = destination.schedules.find((item) => item.id === scheduleId);
  const price = destination.prices.find((item) => item.id === priceId);
  if (!schedule || !price || schedule.publicationStatus !== "published" ||
      schedule.availabilityStatus !== "available") return null;
  const offers = destination.highlights.filter((offer) =>
    offer.enabled &&
    offer.scheduleId === scheduleId &&
    offer.discountType === "fixed" &&
    Number.isInteger(offer.discountValue) &&
    (offer.discountValue ?? 0) > 0 &&
    (offer.discountValue ?? 0) < price.amount,
  );
  return offers.reduce<HighlightOffer | null>((best, offer) =>
    !best || getDiscountedPriceAmount(price, offer) <
      getDiscountedPriceAmount(price, best) ? offer : best, null);
}

export type TripPriceBreakdown = {
  normalPrice: number;
  promotionDiscount: number;
  afterPromotion: number;
  voucherDiscount: number;
  finalPrice: number;
  promotion: HighlightOffer | null;
};

export function getTripPriceBreakdown(
  destination: TripDestination,
  scheduleId: string,
  priceId: string,
  voucherAmount = 0,
): TripPriceBreakdown {
  const schedule = destination.schedules.find((item) => item.id === scheduleId);
  if (!schedule || schedule.publicationStatus !== "published" ||
      schedule.availabilityStatus !== "available") {
    throw new Error("Tanggal trip tidak tersedia untuk pemesanan.");
  }
  const price = destination.prices.find((item) => item.id === priceId);
  if (!price || !Number.isSafeInteger(price.amount) || price.amount <= 0) {
    throw new Error("Harga atau meeting point tidak valid.");
  }
  if (!Number.isSafeInteger(voucherAmount) || voucherAmount < 0) {
    throw new Error("Nominal voucher tidak valid.");
  }
  const promotion = getApplicablePromotion(destination, scheduleId, priceId);
  const afterPromotion = promotion
    ? getDiscountedPriceAmount(price, promotion)
    : price.amount;
  const promotionDiscount = price.amount - afterPromotion;
  const voucherDiscount = Math.min(voucherAmount, afterPromotion);
  return {
    normalPrice: price.amount,
    promotionDiscount,
    afterPromotion,
    voucherDiscount,
    finalPrice: afterPromotion - voucherDiscount,
    promotion,
  };
}
