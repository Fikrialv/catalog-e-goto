"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categoryLabel } from "@/lib/format";
import type { TripDestination } from "@/types/catalog";
import { ScheduleChips } from "@/components/catalog/schedule-chips";
import { trackCatalogEvent } from "@/components/catalog/event-tracker";
import { whatsappHref, WHATSAPP_NUMBER } from "@/lib/whatsapp";
import {
  getDiscountedPriceAmount,
  getMonthlyHighlights,
  monthKeyFromDate,
} from "@/lib/catalog-utils";
import {
  formatCustomerPrice,
  useCustomerPreferences,
} from "@/components/site/customer-preferences";

export function DestinationCard({
  destination,
}: {
  destination: TripDestination;
}) {
  const { currency, language } = useCustomerPreferences();
  const copy =
    language === "en"
      ? {
          discount: "Discount",
          departure: "Departs",
          itinerary: "itinerary days",
          unavailable: "Unavailable",
          allMeetingPoints: "Applies to all meeting points",
          allSchedules: "all available schedules",
        }
      : {
          discount: "Diskon",
          departure: "Berangkat",
          itinerary: "hari itinerary",
          unavailable: "Belum tersedia",
          allMeetingPoints: "Berlaku untuk semua titik keberangkatan",
          allSchedules: "semua jadwal tersedia",
        };
  const priceFrom = Math.min(
    ...destination.prices.map((price) => price.amount),
  );
  const highlight = destination.schedules[0]
    ? (getMonthlyHighlights(
        destination,
        monthKeyFromDate(destination.schedules[0].startDate),
      )[0] ?? null)
    : null;
  const highlightPrice = highlight
    ? (destination.prices.find((price) => price.id === highlight.priceId) ??
      destination.prices[0])
    : null;
  const highlightHref =
    highlight && highlightPrice
      ? whatsappHref(
          destination,
          language === "en"
            ? "All available schedules"
            : "Semua jadwal tersedia",
          {
            ...highlightPrice,
            amount: getDiscountedPriceAmount(highlightPrice, highlight),
          },
        )
      : null;
  const detailHref = `/catalog/${destination.slug}${highlight ? `?highlight=${highlight.id}` : ""}`;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-ink/10 bg-card shadow-[0_10px_35px_rgba(25,48,39,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(25,48,39,0.12)]">
      <Link
        href={detailHref}
        className="relative block aspect-[1.15] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-label={`Lihat detail ${destination.name}`}
      >
        <Image
          src={destination.coverImage.src}
          alt={destination.coverImage.alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={70}
          className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/92 via-primary-dark/18 to-transparent" />
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
          <div className="min-w-0">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/90">
              {categoryLabel(destination.category)}
            </p>
            <h2 className="max-w-[18ch] text-balance font-serif text-2xl leading-[0.98] tracking-[-0.03em] sm:text-3xl">
              {destination.name}
            </h2>
          </div>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-md transition-transform duration-200 group-hover:rotate-6"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
        {highlight && highlightPrice ? (
          <div className="rounded-2xl border border-primary/30 bg-primary-soft/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-ink">
                {highlight.label}
              </span>
              <span className="rounded-full bg-primary-dark px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
                {copy.discount}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold text-ink-muted">
              {copy.allMeetingPoints} · {copy.allSchedules} ·{" "}
              {destination.itinerary.length} {copy.itinerary}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <del className="text-sm text-ink-muted">
                {formatCustomerPrice(highlightPrice.amount, currency)}
              </del>
              <strong className="font-serif text-2xl tracking-[-0.03em] text-ink">
                {formatCustomerPrice(
                  getDiscountedPriceAmount(highlightPrice, highlight),
                  currency,
                )}
              </strong>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span>{destination.duration}</span>
            <span className="text-ink/25" aria-hidden="true">
              •
            </span>
            <span>
              {language === "en" ? "From" : "Mulai"}{" "}
              <strong className="font-semibold text-ink">
                {formatCustomerPrice(priceFrom, currency)}
              </strong>
            </span>
          </div>
        )}
        <div>
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-muted">
            {language === "en" ? "Trip dates" : "Jadwal katalog"}
          </p>
          <ScheduleChips schedules={destination.schedules} />
        </div>
        <div className="mt-auto grid gap-2">
          <Link
            href={detailHref}
            className="group/link inline-flex min-h-11 items-center justify-between rounded-full border border-ink/12 px-4 text-sm font-semibold text-ink transition-[background-color,border-color] duration-200 hover:border-primary hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {highlight
              ? language === "en"
                ? "View offer"
                : "Lihat detail promo"
              : "Explore Trip"}
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              aria-hidden="true"
            />
          </Link>
          {highlightHref && WHATSAPP_NUMBER ? (
            <a
              href={highlightHref}
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                trackCatalogEvent(
                  "whatsapp_cta_clicked",
                  destination.slug,
                  highlightPrice?.id,
                )
              }
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#16804b] px-4 text-sm font-semibold text-white transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#117441] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16804b]"
            >
              {language === "en"
                ? "Ask about offer via WhatsApp"
                : "Tanya promo via WhatsApp"}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
