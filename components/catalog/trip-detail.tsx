"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, CircleAlert, MapPin, Sparkles } from "lucide-react";
import { formatScheduleLabel, categoryLabel } from "@/lib/format";
import type { DepartureSchedule, TripDestination } from "@/types/catalog";
import { WhatsAppButton } from "@/components/catalog/whatsapp-button";
import { VoucherRedemption } from "@/components/catalog/voucher-redemption";
import { ItineraryTimeline } from "@/components/catalog/itinerary-timeline";
import {
  getDestinationHighlights,
  getDiscountedPriceAmount,
} from "@/lib/catalog-utils";
import { trackCatalogEvent } from "@/components/catalog/event-tracker";
import {
  formatCustomerPrice,
  useCustomerPreferences,
} from "@/components/site/customer-preferences";

export function TripDetail({
  destination,
  highlightId,
}: {
  destination: TripDestination;
  highlightId?: string;
}) {
  const { currency, language } = useCustomerPreferences();
  const copy =
    language === "en"
      ? {
          overview:
            "E-GOTO trip information with schedules, prices, itineraries, and trip essentials in one place.",
          scheduleEyebrow: "Departure schedule",
          scheduleTitle: "Choose your travel date.",
          promoDates: "Promo dates are set by the admin.",
          available: "Available",
          full: "Full",
          cancelled: "Cancelled",
          closed: "Closed",
          noSchedule: "No calendar schedule is available for this destination.",
          selectedSchedule: "Selected schedule:",
          itineraryEyebrow: "Trip itinerary",
          itineraryTitle: "A journey with a clear rhythm.",
          promoItinerary: "Your prepared promo itinerary.",
          meetingPoint: "Meeting point",
          choosePrice: "Choose a price option.",
          discountScope:
            "Discount active for every meeting point and available departure schedule.",
          include: "Included",
          exclude: "Not included",
          notes: "Notes",
          updated: "Information updated 6 Sep 2026",
        }
      : {
          overview:
            "Informasi perjalanan E-GOTO dengan detail jadwal, harga, itinerary, dan kebutuhan trip dalam satu halaman.",
          scheduleEyebrow: "Jadwal keberangkatan",
          scheduleTitle: "Pilih tanggal perjalanan.",
          promoDates: "Tanggal promo ditentukan admin.",
          available: "Tersedia",
          full: "Penuh",
          cancelled: "Dibatalkan",
          closed: "Ditutup",
          noSchedule: "Jadwal kalender belum tersedia untuk destinasi ini.",
          selectedSchedule: "Jadwal terpilih:",
          itineraryEyebrow: "Rundown perjalanan",
          itineraryTitle: "Perjalanan dalam ritme yang jelas.",
          promoItinerary: "Itinerary promo yang sudah disiapkan.",
          meetingPoint: "Titik keberangkatan",
          choosePrice: "Pilih opsi harga.",
          discountScope:
            "Diskon aktif untuk semua titik keberangkatan dan jadwal keberangkatan tersedia.",
          include: "Termasuk",
          exclude: "Tidak termasuk",
          notes: "Catatan",
          updated: "Info diperbarui 6 Sep 2026",
        };
  const highlightOffer =
    (highlightId
      ? getDestinationHighlights(destination).find(
          (offer) => offer.id === highlightId,
        )
      : getDestinationHighlights(destination)[0]) ?? null;
  const publishedSchedules = destination.schedules.filter(
    (schedule) => schedule.publicationStatus === "published",
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    publishedSchedules[0]?.id ?? "",
  );
  const [selectedPriceId, setSelectedPriceId] = useState(
    highlightOffer?.priceId ?? destination.prices[0]?.id ?? "",
  );
  const [voucherRedemption, setVoucherRedemption] = useState<{
    amount: number;
    finalAmount: number;
    redemptionId: string;
  } | null>(null);
  const selectedSchedule = publishedSchedules.find(
    (schedule) => schedule.id === selectedScheduleId,
  );
  const selectedPrice = destination.prices.find(
    (price) => price.id === selectedPriceId,
  ) ??
    destination.prices[0] ?? {
      id: "price-unavailable",
      label: "Belum tersedia",
      amount: 0,
      sortOrder: 0,
    };
  const promotionalPrice = highlightOffer
    ? {
        ...selectedPrice,
        amount: getDiscountedPriceAmount(selectedPrice, highlightOffer),
      }
    : selectedPrice;
  const whatsappPrice = voucherRedemption
    ? { ...promotionalPrice, amount: voucherRedemption.finalAmount }
    : promotionalPrice;
  const displayItinerary = destination.itinerary;
  const scheduleByMonth = publishedSchedules.reduce<
    Record<string, DepartureSchedule[]>
  >((groups, schedule) => {
    const key = schedule.startDate.slice(0, 7);
    groups[key] ??= [];
    groups[key].push(schedule);
    return groups;
  }, {});

  useEffect(() => {
    trackCatalogEvent("destination_view", destination.slug);
  }, [destination.slug]);

  return (
    <div className="catalog-surface">
      <section className="customer-hero-surface relative isolate overflow-hidden px-5 pb-16 pt-32 text-ink sm:px-8 sm:pb-20 lg:px-12">
        <div className="mx-auto grid min-w-0 max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)] lg:items-end">
          <div className="min-w-0 max-w-2xl">
            <p className="eyebrow">
              {categoryLabel(destination.category)} · {destination.duration}
            </p>
            <h1 className="mt-5 text-balance font-serif text-5xl leading-[0.94] tracking-[-0.055em] sm:text-7xl">
              {destination.name}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink-muted">
              {copy.overview}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
            <Image
              src={destination.coverImage.src}
              alt={destination.coverImage.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              quality={70}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#064e4f]/40 to-transparent" />
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid min-w-0 max-w-[1440px] gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)] lg:gap-24">
          <div className="min-w-0 space-y-16">
            <section aria-labelledby="schedule-title">
              <div className="mb-7 flex items-end justify-between gap-5">
                <div>
                  <p className="eyebrow">{copy.scheduleEyebrow}</p>
                  <h2
                    id="schedule-title"
                    className="mt-3 font-serif text-4xl tracking-[-0.045em] text-ink"
                  >
                    {copy.scheduleTitle}
                  </h2>
                </div>
                <MapPin
                  className="hidden h-8 w-8 text-accent sm:block"
                  aria-hidden="true"
                />
              </div>
              {highlightOffer ? (
                <div className="rounded-[1.5rem] border border-primary/30 bg-primary-soft p-6">
                  <p className="eyebrow">{highlightOffer.label}</p>
                  <h3 className="mt-3 font-serif text-3xl tracking-[-0.04em] text-ink">
                    {copy.promoDates}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-ink-muted">
                    {copy.discountScope}
                  </p>
                </div>
              ) : Object.keys(scheduleByMonth).length ? (
                <div className="space-y-7">
                  {Object.entries(scheduleByMonth).map(([month, schedules]) => (
                    <div key={month}>
                      <p className="mb-3 text-sm font-semibold text-ink-muted">
                        Jadwal{" "}
                        {new Intl.DateTimeFormat("id-ID", {
                          month: "long",
                          year: "numeric",
                        }).format(new Date(`${month}-01T00:00:00Z`))}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {schedules.map((schedule) => {
                          const selected = schedule.id === selectedScheduleId;
                          const unavailable =
                            schedule.availabilityStatus !== "available";
                          return (
                            <button
                              key={schedule.id}
                              type="button"
                              disabled={unavailable}
                              aria-pressed={selected}
                              onClick={() => setSelectedScheduleId(schedule.id)}
                              className={`min-h-16 rounded-2xl border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? "border-ink bg-ink text-white" : "border-ink/12 bg-white text-ink hover:-translate-y-0.5 hover:border-ink/30"} ${unavailable ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
                            >
                              <span className="block text-sm font-bold">
                                {formatScheduleLabel(schedule)}
                              </span>
                              <span
                                className={`mt-1 block text-xs ${selected ? "text-white/65" : "text-ink-muted"}`}
                              >
                                {schedule.availabilityStatus === "available"
                                  ? copy.available
                                  : schedule.availabilityStatus === "full"
                                    ? copy.full
                                    : schedule.availabilityStatus ===
                                        "cancelled"
                                      ? copy.cancelled
                                      : copy.closed}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex gap-3 rounded-2xl border border-dashed border-ink/20 bg-white p-5 text-sm leading-6 text-ink-muted">
                  <CircleAlert
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  {copy.noSchedule}
                  Informasi source yang tersedia:{" "}
                  {destination.notes[0] ?? "belum ada catatan jadwal kalender."}
                </div>
              )}
              {selectedSchedule && (
                <p className="mt-5 text-sm text-ink-muted">
                  {copy.selectedSchedule}{" "}
                  <strong className="text-ink">
                    {formatScheduleLabel(selectedSchedule)}
                  </strong>
                </p>
              )}
            </section>

            <section aria-labelledby="itinerary-title">
              <p className="eyebrow">{copy.itineraryEyebrow}</p>
              <h2
                id="itinerary-title"
                className="mt-3 font-serif text-4xl tracking-[-0.045em] text-ink"
              >
                {highlightOffer ? copy.promoItinerary : copy.itineraryTitle}
              </h2>
              <div className="mt-8">
                <ItineraryTimeline itinerary={displayItinerary} />
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-8 lg:self-start">
            <section
              className="rounded-[1.5rem] border border-ink/10 bg-white p-6 shadow-[0_14px_45px_rgba(25,48,39,0.06)] sm:p-7"
              aria-labelledby="price-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{copy.meetingPoint}</p>
                  <h2
                    id="price-title"
                    className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink"
                  >
                    {copy.choosePrice}
                  </h2>
                </div>
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              {highlightOffer ? (
                <p className="mt-5 rounded-xl border border-primary/35 bg-primary-soft px-4 py-3 text-sm font-semibold leading-6 text-ink">
                  {copy.discountScope}
                </p>
              ) : null}
              <div className="mt-6 space-y-2">
                {destination.prices.map((price) => {
                  const selected = price.id === selectedPriceId;
                  const isDiscountedPrice = Boolean(highlightOffer);
                  return (
                    <button
                      key={price.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedPriceId(price.id);
                        setVoucherRedemption(null);
                        trackCatalogEvent(
                          "departure_selected",
                          destination.slug,
                          price.id,
                        );
                      }}
                      className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 text-left transition-[background-color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? "border-ink bg-ink text-white" : "border-ink/10 bg-paper text-ink hover:border-ink/30"}`}
                    >
                      <span className="text-sm font-semibold">
                        {price.label}
                      </span>
                      <span className="text-right text-sm font-bold tabular-nums">
                        {isDiscountedPrice ? (
                          <>
                            <del
                              className={`block text-xs font-normal ${selected ? "text-white/60" : "text-ink-muted"}`}
                            >
                              {formatCustomerPrice(price.amount, currency)}
                            </del>
                            <span className={`block ${selected ? "text-white" : "text-primary-dark"}`}>
                              {formatCustomerPrice(
                                getDiscountedPriceAmount(
                                  price,
                                  highlightOffer!,
                                ),
                                currency,
                              )}
                            </span>
                          </>
                        ) : (
                          formatCustomerPrice(price.amount, currency)
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <VoucherRedemption
                destination={destination}
                price={selectedPrice}
                onRedeemed={setVoucherRedemption}
              />
              <div className="my-7 h-px bg-ink/10" />
              <div className="flex justify-center">
                <WhatsAppButton
                  destination={destination}
                  schedule={selectedSchedule}
                  price={whatsappPrice}
                  voucherRedemptionId={voucherRedemption?.redemptionId}
                />
              </div>
            </section>

            <InfoList title={copy.include} items={destination.includes} />
            <InfoList title={copy.exclude} items={destination.excludes} />
            <section
              className="rounded-[1.5rem] border border-ink/10 bg-primary-soft p-6 sm:p-7"
              aria-labelledby="notes-title"
            >
              <p className="eyebrow">{copy.notes}</p>
              <h2
                id="notes-title"
                className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink"
              >
                {language === "en"
                  ? "Things to know."
                  : "Hal yang perlu diketahui."}
              </h2>
              {destination.notes.length ? (
                <ul className="mt-5 space-y-3">
                  {destination.notes.map((note) => (
                    <li key={note} className="text-sm leading-6 text-ink-muted">
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm leading-6 text-ink-muted">
                  {language === "en"
                    ? "No additional notes are available."
                    : "Belum ada catatan tambahan dari source."}
                </p>
              )}
              <p className="mt-6 border-t border-ink/10 pt-4 text-xs font-semibold text-ink-muted">
                {copy.updated}
              </p>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <section
      className="rounded-[1.5rem] border border-ink/10 bg-white p-6 sm:p-7"
      aria-labelledby={`${title.toLowerCase()}-title`}
    >
      <p className="eyebrow">Trip information</p>
      <h2
        id={`${title.toLowerCase()}-title`}
        className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink"
      >
        {title}
      </h2>
      {items.length ? (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-6 text-ink-muted"
            >
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-accent"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 flex gap-3 text-sm leading-6 text-ink-muted">
          <CircleAlert
            className="mt-1 h-4 w-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          Belum ada data {title.toLowerCase()} pada source.
        </p>
      )}
    </section>
  );
}
