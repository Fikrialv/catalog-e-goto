import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import {
  getCatalogMonthsFromDestinations,
  getMonthlyDestinationsFromDestinations,
  getPublishedDestinations,
} from "@/services/catalog";
import type { Category } from "@/types/catalog";

export const metadata: Metadata = {
  title: "Katalog Trip | E-GOTO",
  description: "Pilih Monthly Catalog dan temukan jadwal perjalanan E-GOTO.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedMonth = typeof params.month === "string" ? params.month : "";
  const category =
    typeof params.category === "string"
      ? (params.category as Category | "all")
      : "all";
  const search = typeof params.search === "string" ? params.search : "";
  const duration =
    typeof params.duration === "string" ? params.duration : "all";
  const publishedDestinations = await getPublishedDestinations();
  const months = getCatalogMonthsFromDestinations(publishedDestinations);
  const month = months.some((item) => item.key === requestedMonth)
    ? requestedMonth
    : (months[0]?.key ?? "");
  const destinations = month
    ? getMonthlyDestinationsFromDestinations(publishedDestinations, {
        monthKey: month,
        category,
        search,
        duration,
      })
    : [];
  return (
    <main className="catalog-surface">
      <div className="customer-hero-surface relative overflow-hidden px-5 pb-12 pt-28 text-ink sm:px-8 lg:px-12">
        <SiteHeader />
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke dashboard
          </Link>
          <p className="eyebrow mt-16">Digital trip catalog</p>
          <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[0.92] tracking-[-0.06em] sm:text-8xl">
            Temukan ritme perjalananmu.
          </h1>
        </div>
      </div>
      <CatalogExplorer
        initialMonth={
          months.some((item) => item.key === month)
            ? month
            : (months[0]?.key ?? "2026-10")
        }
        initialCategory={category}
        initialSearch={search}
        initialDuration={duration}
        initialDestinations={destinations}
        months={months}
      />
    </main>
  );
}
