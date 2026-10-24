import type {
  HighlightOffer,
  PriceOption,
  TripDestination,
} from "@/types/catalog";
import {
  formatPrice,
  formatScheduleLabel,
} from "@/lib/format";
import { getHighlightSchedule, getDiscountedPriceAmount } from "@/lib/catalog-utils";
import { getTripPriceBreakdown, type TripPriceBreakdown } from "@/lib/pricing";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

export function buildWhatsAppMessage(
  destination: TripDestination,
  scheduleLabel: string,
  price: PriceOption,
  voucherRedemptionId?: string,
  voucherAmount?: number,
  breakdown?: TripPriceBreakdown,
) {
  const hasVoucher = Boolean(
    voucherRedemptionId &&
      Number.isFinite(voucherAmount) &&
      (voucherAmount ?? 0) > 0,
  );

  return [
    "Halo E-GOTO,",
    "",
    "saya ingin bertanya tentang trip:",
    "",
    `Destinasi: ${destination.name}`,
    `Tanggal: ${scheduleLabel || "Belum dipilih"}`,
    `Titik keberangkatan: ${price.label}`,
    ...(breakdown
      ? [
          `Harga normal: ${formatPrice(breakdown.normalPrice)}`,
          ...(breakdown.promotionDiscount > 0
            ? [`Diskon tanggal: -${formatPrice(breakdown.promotionDiscount)}`,
               `Harga setelah diskon: ${formatPrice(breakdown.afterPromotion)}`]
            : []),
          ...(hasVoucher
            ? [`Potongan voucher: -${formatPrice(breakdown.voucherDiscount)}`]
            : []),
          `Harga final: ${formatPrice(breakdown.finalPrice)}`,
        ]
      : hasVoucher
        ? [`Potongan voucher: ${formatPrice(voucherAmount!)}`,
           `Harga setelah voucher: ${formatPrice(price.amount)}`]
        : [`Harga: ${formatPrice(price.amount)}`]),
    "",
    "Terima kasih.",
  ].join("\n");
}

export function whatsappHref(
  destination: TripDestination,
  scheduleLabel: string,
  price: PriceOption,
  voucherRedemptionId?: string,
  voucherAmount?: number,
  breakdown?: TripPriceBreakdown,
) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(
      destination,
      scheduleLabel,
      price,
      voucherRedemptionId,
      voucherAmount,
      breakdown,
    ),
  )}`;
}

export function buildHighlightWhatsAppMessage(
  destination: TripDestination,
  highlight: HighlightOffer,
  normalPrice: PriceOption,
) {
  const schedule = getHighlightSchedule(destination, highlight);
  const pricing = schedule && schedule.publicationStatus === "published" &&
      schedule.availabilityStatus === "available"
    ? getTripPriceBreakdown(destination, schedule.id, normalPrice.id)
    : null;
  if (!pricing || pricing.promotion?.id !== highlight.id) return "";
  return [
    "Halo E-GOTO,",
    "",
    "saya ingin bertanya tentang highlight discount:",
    "",
    `Destinasi: ${destination.name}`,
    `Promo: ${highlight.label}`,
    `Tanggal: ${schedule ? formatScheduleLabel(schedule) : "Belum tersedia"}`,
    `Titik keberangkatan: ${normalPrice.label}`,
    `Harga normal: ${formatPrice(normalPrice.amount)}`,
    `Harga discount: ${formatPrice(pricing.finalPrice)}`,
    "Itinerary:",
    ...destination.itinerary.map((day) => `${day.dayNumber}. ${day.title}`),
    "",
    "Terima kasih.",
  ].join("\n");
}

export function highlightWhatsappHref(
  destination: TripDestination,
  highlight: HighlightOffer,
  normalPrice: PriceOption,
) {
  if (!WHATSAPP_NUMBER) return null;
  const message = buildHighlightWhatsAppMessage(destination, highlight, normalPrice);
  return message ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}` : null;
}

export { formatScheduleLabel };
