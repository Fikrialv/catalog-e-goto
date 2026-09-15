"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import type { CatalogMonth, Category, TripDestination } from "@/types/catalog";
import { categoryLabel, formatMonthLabel } from "@/lib/format";
import { MonthSelector } from "@/components/catalog/month-selector";
import { DestinationCard } from "@/components/catalog/destination-card";
import { useCustomerPreferences } from "@/components/site/customer-preferences";

export function CatalogExplorer({
  initialMonth,
  initialCategory,
  initialSearch,
  initialDuration,
  initialDestinations,
  months,
}: {
  initialMonth: string;
  initialCategory: Category | "all";
  initialSearch: string;
  initialDuration: string;
  initialDestinations: TripDestination[];
  months: CatalogMonth[];
}) {
  const { language } = useCustomerPreferences();
  const copy =
    language === "en"
      ? {
          title: "Choose a month, find your trip.",
          description:
            "Available dates appear on every destination. Choose a trip for full details.",
          category: "Category",
          allCategories: "All categories",
          duration: "Duration",
          allDurations: "All durations",
          apply: "Apply filters",
          scheduled: "destinations with published schedules",
          tripInformation: "Trip information",
          empty: "No schedules this month.",
          emptyDescription:
            "Choose another month or return after trip information is updated.",
        }
      : {
          title: "Pilih bulan, temukan perjalanan.",
          description:
            "Jadwal yang tersedia ditampilkan ringkas di setiap destinasi. Pilih trip untuk melihat detail lengkap.",
          category: "Kategori",
          allCategories: "Semua kategori",
          duration: "Durasi",
          allDurations: "Semua durasi",
          apply: "Terapkan filter",
          scheduled: "destinasi dengan jadwal terbit",
          tripInformation: "Informasi trip",
          empty: "Belum ada jadwal di bulan ini.",
          emptyDescription:
            "Coba pilih bulan lain atau kembali lagi setelah informasi trip diperbarui.",
        };
  const router = useRouter();
  const pathname = usePathname();
  const [month, setMonth] = useState(initialMonth);
  const [category, setCategory] = useState<Category | "all">(initialCategory);
  const [duration, setDuration] = useState(initialDuration);
  const [search, setSearch] = useState(initialSearch);

  function applyFilters(event?: FormEvent) {
    event?.preventDefault();
    const query = new URLSearchParams({ month });
    if (category !== "all") query.set("category", category);
    if (duration !== "all") query.set("duration", duration);
    if (search.trim()) query.set("search", search.trim());
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  }

  function selectMonth(value: string) {
    setMonth(value);
    const query = new URLSearchParams({ month: value });
    if (category !== "all") query.set("category", category);
    if (duration !== "all") query.set("duration", duration);
    if (search.trim()) query.set("search", search.trim());
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  }

  return (
    <section
      id="catalog-grid"
      className="scroll-mt-8 bg-paper/82 px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">Monthly Catalog</p>
            <h1 className="mt-4 text-balance font-serif text-5xl leading-[0.95] tracking-[-0.055em] text-ink sm:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-muted sm:text-lg">
              {copy.description}
            </p>
          </div>
          <div className="max-w-full lg:w-[560px]">
            <MonthSelector
              selectedMonth={month}
              onSelect={selectMonth}
              months={months}
            />
          </div>
        </div>

        <form
          onSubmit={applyFilters}
          className="mb-10 border-y border-ink/10 py-4"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(190px,0.6fr)_minmax(190px,0.6fr)] lg:items-end">
            <label className="group grid min-h-14 gap-2 border-b border-ink/20 pb-2 focus-within:border-accent">
              <span className="sr-only">Cari destination</span>
              <span className="flex items-center gap-3 text-sm text-ink-muted">
                <Search className="h-4 w-4" aria-hidden="true" />
                <input
                  name="catalog-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari destination…"
                  className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted"
                />
              </span>
            </label>
            <label className="grid min-h-14 gap-2 border-b border-ink/20 pb-2 focus-within:border-accent">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                {copy.category}
              </span>
              <span className="relative flex items-center gap-3">
                <SlidersHorizontal
                  className="h-4 w-4 shrink-0 text-ink-muted"
                  aria-hidden="true"
                />
                <select
                  name="catalog-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as Category | "all")
                  }
                  className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-sm font-semibold text-ink outline-none"
                >
                  <option value="all">{copy.allCategories}</option>
                  <option value="mountain">{categoryLabel("mountain")}</option>
                  <option value="beach_waterfall">
                    {categoryLabel("beach_waterfall")}
                  </option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 h-4 w-4 text-ink-muted"
                  aria-hidden="true"
                />
              </span>
            </label>
            <label className="grid min-h-14 gap-2 border-b border-ink/20 pb-2 focus-within:border-accent">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                {copy.duration}
              </span>
              <span className="relative">
                <select
                  name="catalog-duration"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="min-w-0 w-full appearance-none bg-transparent pr-6 text-sm font-semibold text-ink outline-none"
                >
                  <option value="all">{copy.allDurations}</option>
                  <option value="2 Hari">2 Hari</option>
                  <option value="3 Hari">3 Hari</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 top-0 h-4 w-4 text-ink-muted"
                  aria-hidden="true"
                />
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="mt-5 min-h-11 rounded-full bg-primary-dark px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {copy.apply}
          </button>
        </form>

        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              Katalog {formatMonthLabel(month)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {initialDestinations.length} {copy.scheduled}
            </p>
          </div>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted sm:block">
            {copy.tripInformation}
          </span>
        </div>
        {initialDestinations.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {initialDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white px-6 py-20 text-center">
            <p className="font-serif text-3xl tracking-[-0.03em] text-ink">
              {copy.empty}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-muted">
              {copy.emptyDescription}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
