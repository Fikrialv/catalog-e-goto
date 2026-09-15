import type {
  HighlightOffer,
  PriceOption,
  TripDestination,
} from "@/types/catalog";
import {
  formatDateLabel,
  formatPrice,
  formatScheduleLabel,
} from "@/lib/format";
import { getDiscountedPriceAmount, getHighlightSchedule } from "@/lib/catalog-utils";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

export function buildWhatsAppMessage(
  destination: TripDestination,
  scheduleLabel: string,
  price: PriceOption,
  voucherRedemptionId?: string,
) {
  return [
    "Halo E-GOTO,",
    "",
    "saya ingin bertanya tentang trip:",
    "",
    `Destinasi: ${destination.name}`,
    `Tanggal: ${scheduleLabel || "Belum dipilih"}`,
    `Titik keberangkatan: ${price.label}`,
    `Harga: ${formatPrice(price.amount)}`,
    ...(voucherRedemptionId ? [`ID penukaran voucher: ${voucherRedemptionId}`] : []),
    "",
    "Terima kasih.",
  ].join("\n");
}

export function whatsappHref(
  destination: TripDestination,
  scheduleLabel: string,
  price: PriceOption,
  voucherRedemptionId?: string,
) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(destination, scheduleLabel, price, voucherRedemptionId))}`;
}

export function buildHighlightWhatsAppMessage(
  destination: TripDestination,
  highlight: HighlightOffer,
  normalPrice: PriceOption,
) {
  const schedule = getHighlightSchedule(destination, highlight);
  return [
    "Halo E-GOTO,",
    "",
    "saya ingin bertanya tentang highlight discount:",
    "",
    `Destinasi: ${destination.name}`,
    `Promo: ${highlight.label}`,
    `Tanggal: ${schedule ? formatDateLabel(schedule.startDate) : "Belum tersedia"}`,
    `Titik keberangkatan: ${normalPrice.label}`,
    `Harga normal: ${formatPrice(normalPrice.amount)}`,
    `Harga discount: ${formatPrice(getDiscountedPriceAmount(normalPrice, highlight))}`,
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
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildHighlightWhatsAppMessage(destination, highlight, normalPrice))}`;
}

export { formatScheduleLabel };
