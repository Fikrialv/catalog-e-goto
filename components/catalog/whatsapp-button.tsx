"use client";

import { ArrowUpRight, MessageCircle } from "lucide-react";
import { whatsappHref, WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { formatScheduleLabel } from "@/lib/format";
import { trackCatalogEvent } from "@/components/catalog/event-tracker";
import { useCustomerPreferences } from "@/components/site/customer-preferences";
import type {
  DepartureSchedule,
  PriceOption,
  TripDestination,
} from "@/types/catalog";

export function WhatsAppButton({
  destination,
  schedule,
  price,
  voucherRedemptionId,
  voucherAmount,
}: {
  destination: TripDestination;
  schedule: DepartureSchedule | undefined;
  price: PriceOption;
  voucherRedemptionId?: string;
  voucherAmount?: number;
}) {
  const { language } = useCustomerPreferences();
  const copy =
    language === "en"
      ? {
          ask: "Ask via WhatsApp",
          unavailable: "WhatsApp number is not configured.",
          inquiry:
            "Your inquiry includes selected destination, date, and meeting point.",
        }
      : {
          ask: "Tanya via WhatsApp",
          unavailable: "Nomor WhatsApp belum dikonfigurasi.",
          inquiry:
            "Pesan inquiry akan membawa destination, tanggal, dan price option terpilih.",
        };
  const scheduleLabel = schedule
    ? formatScheduleLabel(schedule)
    : "Belum dipilih";
  const href = whatsappHref(
    destination,
    scheduleLabel,
    price,
    voucherRedemptionId,
    voucherAmount,
  );

  if (!WHATSAPP_NUMBER || !href) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-ink/20 bg-paper p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dff4e8] text-[#16804b]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-ink">{copy.ask}</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              {copy.unavailable} {copy.inquiry}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Tanya ${destination.name} via WhatsApp`}
      onClick={() =>
        trackCatalogEvent(
          "whatsapp_cta_clicked",
          destination.slug,
          price.id,
        )
      }
      className="whatsapp-button group relative inline-flex h-12 w-full max-w-[420px] cursor-pointer items-center overflow-hidden rounded-full border border-[#0d6b40] bg-[#16804b] p-1 pe-14 ps-6 text-sm font-medium text-white shadow-[0_12px_28px_-16px_rgba(11,91,55,0.85)] transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#117441] hover:shadow-[0_16px_30px_-14px_rgba(11,91,55,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16804b] focus-visible:ring-offset-2"
    >
      <span className="relative z-10 inline-flex items-center gap-2 whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {copy.ask}
      </span>
      <span className="whatsapp-button__orb absolute right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#16804b] transition-[right,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:right-[calc(100%_-_44px)] group-hover:rotate-45 group-focus-visible:right-[calc(100%_-_44px)] group-focus-visible:rotate-45">
        <ArrowUpRight size={16} aria-hidden="true" />
      </span>
    </a>
  );
}
