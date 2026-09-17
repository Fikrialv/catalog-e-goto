export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { AnimatedMarqueeHero } from "@/components/ui/hero-3";
import { SiteHeader } from "@/components/site/site-header";
import { heroImages } from "@/data/trip-images";
import {
  getCatalogMonthsFromDestinations,
  getPublishedDestinations,
} from "@/services/catalog";
import { DestinationCard } from "@/components/catalog/destination-card";
import { getDestinationHighlights } from "@/lib/catalog-utils";

export default async function HomePage() {
  const destinations = await getPublishedDestinations();
  const catalogMonths = getCatalogMonthsFromDestinations(destinations);
  const activeHighlights = destinations.filter(
    (destination) => getDestinationHighlights(destination).length > 0,
  );
  const fallbackFeatured = destinations.slice(0, 3);
  const featured = activeHighlights.length
    ? activeHighlights
    : fallbackFeatured;

  return (
    <main className="landing-surface">
      <section className="relative">
        <SiteHeader />
        <AnimatedMarqueeHero
          tagline="Explore More, Live More"
          title="Temukan Perjalananmu"
          description="Jelajahi berbagai pilihan perjalanan E-GOTO, temukan destinasi favoritmu, dan lihat jadwal trip yang tersedia."
          ctaText="Lihat Katalog Trip"
          images={heroImages}
        />
        <a
          href="#monthly-catalog"
          className="absolute bottom-7 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex"
        >
          Scroll untuk menjelajah
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <section
        id="monthly-catalog"
        className="relative isolate overflow-hidden border-b border-ink/10 bg-paper/78 px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
      >
        <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">Arah perjalanan</p>
            <h2 className="mt-4 max-w-lg text-balance font-serif text-5xl leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl">
              Satu bulan. Banyak kemungkinan.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">
              Pilih konteks bulan untuk melihat destination dengan tanggal
              keberangkatan yang tersedia.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {catalogMonths.map((month, index) => (
              <Link
                key={month.key}
                href={`/catalog?month=${month.key}`}
                className="group min-h-40 rounded-[1.25rem] border border-ink/10 bg-white p-5 text-ink transition-[transform,background-color,border-color,color] duration-200 ease-out hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted transition-colors duration-200 group-hover:text-ink/70">
                  Katalog {String(index + 10).padStart(2, "0")}
                </span>
                <span className="mt-10 block font-serif text-2xl tracking-[-0.035em]">
                  {month.label}
                </span>
                <ArrowUpRight
                  className="mt-5 h-5 w-5 text-ink-muted transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper/35 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">
                {activeHighlights.length
                  ? "Highlight discount"
                  : "Destination collection"}
              </p>
              <h2 className="mt-4 text-balance font-serif text-5xl leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl">
                {activeHighlights.length
                  ? "Trip pilihan dengan harga spesial."
                  : "Tempat yang layak dituju."}
              </h2>
              {activeHighlights.length ? (
                <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">
                  Tanggal, harga discount, dan itinerary ditentukan langsung
                  oleh admin.
                </p>
              ) : null}
            </div>
            <Link
              href="/catalog"
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink underline decoration-ink/20 underline-offset-8 transition-colors hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Lihat semua trip{" "}
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {featured.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow eyebrow-on-dark">E-GOTO trip information</p>
            <h2 className="mt-4 max-w-xl font-serif text-5xl leading-[0.95] tracking-[-0.055em] sm:text-6xl">
              Jelajahi lebih jauh,
              <br />
              dengan informasi yang terasa dekat.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <ValueCard
              index="01"
              title="Jelajah"
              text="Temukan rute dan suasana yang berbeda."
            />
            <ValueCard
              index="02"
              title="Siap berangkat"
              text="Lihat jadwal yang tersedia dengan mudah."
            />
            <ValueCard
              index="03"
              title="Tetap natural"
              text="Informasi trip yang jelas, ringan, dan mudah dibaca."
            />
          </div>
        </div>
      </section>

      <section className="bg-paper/35 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-8 rounded-[1.75rem] bg-ink px-7 py-10 sm:px-10 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow eyebrow-on-dark">Mulai dari informasi</p>
            <h2 className="mt-4 max-w-2xl font-serif text-5xl leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl">
              Pilih perjalanan yang terasa milikmu.
            </h2>
          </div>
          <Link
            href="/catalog"
            className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-primary-dark transition-[transform,background-color,color] duration-200 hover:-translate-y-1 hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Lihat Katalog Trip{" "}
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>
      <footer className="border-t border-ink/10 px-5 py-8 text-sm text-ink-muted sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-ink">
            E-GOTO Digital Trip Catalog
          </span>
          <span>Info diperbarui 6 Sep 2026</span>
        </div>
      </footer>
    </main>
  );
}

function ValueCard({
  index,
  title,
  text,
}: {
  index: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-white/15 bg-white/8 p-5">
      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <span className="relative block h-6 w-12" aria-hidden="true">
          <span className="absolute left-0 top-2 h-px w-12 bg-white" />
          <span className="absolute left-3 top-0 h-5 w-px bg-white" />
          <span className="absolute left-9 top-1 h-3 w-px bg-white/60" />
        </span>
        <span className="text-xs font-bold tracking-[0.16em] text-white/70">
          Card {index}
        </span>
      </div>
      <h3 className="mt-8 font-serif text-2xl tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/85">{text}</p>
    </div>
  );
}
