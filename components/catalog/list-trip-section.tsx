"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, MapPin, MessageCircle, Search, X } from "lucide-react";
import type { TripCategory } from "@/types/catalog";
import type { ListTrip } from "@/types/list-trip";
import { publicCategoriesForTrip, publicCategoryNamesForTrip, filterListTrips, buildTripInquiryMessage } from "@/lib/list-trip";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

const PAGE_SIZE = 8;

export function ListTripSection({
  destinations,
  categories,
}: {
  destinations: ListTrip[];
  categories: TripCategory[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<ListTrip | null>(null);
  const enabledCategories = categories.filter((category) => category.isActive);
  const visibleCategories = enabledCategories.filter((category) =>
    destinations.some((trip) => publicCategoriesForTrip(trip).includes(category.slug))
  );
  const shown = useMemo(
    () => filterListTrips(destinations, selectedCategory, query),
    [destinations, selectedCategory, query],
  );
  function setCategory(value: string) {
    setSelectedCategory(value);
    setLimit(PAGE_SIZE);
  }

  return (
    <section
      id="list-trip"
      aria-labelledby="list-trip-title"
      className="relative bg-[#e6f3f2] px-4 py-16 text-ink sm:px-8 sm:py-24 lg:px-12"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Explore E-GOTO</p>
            <h2 id="list-trip-title" className="mt-4 font-serif text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              Jelajahi List Trip
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-muted sm:text-base">
              Semua trip E-GOTO yang telah dipublikasikan, termasuk destinasi tanpa jadwal keberangkatan. Pilih jalur dan tanyakan detailnya kepada tim E-GOTO.
            </p>
          </div>
          <label className="relative block w-full shrink-0 lg:max-w-sm">
            <span className="sr-only">Cari destinasi</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"/>
            <input
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setLimit(PAGE_SIZE); }}
              placeholder="Cari destinasi..."
              className="h-14 w-full rounded-2xl border border-ink/15 bg-white pl-14 pr-5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <div aria-label="Filter kategori destinasi" className="mt-8 flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ id: "all", slug: "all", name: "Semua", isActive: true, sortOrder: 0 }, ...visibleCategories].map((category) => (
            <button key={category.slug} type="button" aria-pressed={selectedCategory === category.slug}
              onClick={() => setCategory(category.slug)}
              className={`min-h-11 shrink-0 rounded-full border px-5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${selectedCategory === category.slug ? "border-ink bg-ink text-white" : "border-ink/15 bg-white/85 text-ink hover:border-ink/50"}`}>
              {category.name}
            </button>
          ))}
        </div>
        <p role="status" className="mt-2 text-sm text-ink-muted">{shown.length} trip ditemukan</p>

        {shown.length ? (
          <div className="mt-7 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:gap-6">
            {shown.slice(0,limit).map((trip) => {
              const label = publicCategoryNamesForTrip(trip, categories) || "Destinasi";
              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => {
                    setSelected(trip);
                  }}
                  aria-label={`Lihat detail trip ${trip.name}`}
                  className="group relative aspect-[4/5] min-w-0 overflow-hidden rounded-[20px] bg-[#184d50] text-left text-white shadow-[0_12px_32px_-20px_rgba(6,78,79,0.7)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_44px_-20px_rgba(6,78,79,0.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 motion-reduce:transition-none"
                >
                  <Image
                    src={trip.coverImage.src}
                    alt={trip.coverImage.alt || trip.name}
                    fill
                    sizes="(max-width: 359px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#061f25]/95 via-[#061f25]/15 to-transparent"/>
                  <span className="absolute left-3 top-3 max-w-[90%] rounded-full border border-white/30 bg-white/85 px-3 py-1.5 text-[10px] font-bold text-ink backdrop-blur-sm sm:left-4 sm:top-4 sm:text-xs">
                    {label}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-4 sm:px-5 sm:pb-5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-bold leading-tight sm:text-xl">{trip.name}</span>
                      <span className="mt-1.5 flex items-center gap-1 text-xs text-white/85">
                        <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0"/>
                        <span className="line-clamp-1">{trip.location || (trip.routes?.filter((route)=>route.active).length ? `${trip.routes.filter((route)=>route.active).length} pilihan jalur` : "Jelajahi destinasi")}</span>
                      </span>
                    </span>
                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-200 group-hover:translate-x-0.5 sm:h-9 sm:w-9">
                      <ArrowUpRight className="h-4 w-4"/>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-ink/20 bg-white/70 p-9 text-center">
            <p className="text-lg font-semibold">Trip belum ditemukan</p>
            <p className="mt-2 text-sm text-ink-muted">Coba kata kunci atau kategori lainnya.</p>
          </div>
        )}

        {shown.length > limit ? (
          <div className="mt-9 text-center">
            <button type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/20 bg-white px-7 text-sm font-bold transition-colors hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              Muat lebih banyak <ArrowRight aria-hidden="true" className="h-4 w-4"/>
            </button>
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-6">
          <p className="text-sm text-ink-muted">Sudah punya jadwal keberangkatan?</p>
          <Link href="/catalog" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink underline underline-offset-4">
            Lihat Katalog Jadwal <ArrowUpRight className="h-4 w-4" aria-hidden="true"/>
          </Link>
        </div>
      </div>
      {selected ? <TripInquiryModal key={selected.id} trip={selected} onClose={() => setSelected(null)} categories={categories}/> : null}
    </section>
  );
}

function TripInquiryModal({
  trip, onClose, categories,
}: {
  trip: ListTrip;
  onClose: () => void;
  categories: TripCategory[];
}) {
  const [routeId, setRouteId] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const existing = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
      ));
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = existing;
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [trip, onClose]);
  if (typeof document === "undefined") return null;
  const gallery = [trip.coverImage, ...trip.gallery.filter((image) => image.src !== trip.coverImage.src)];
  const routes = trip.routes?.filter((route) => route.active) ?? [];
  const tagNames = publicCategoriesForTrip(trip).map((slug) =>
    categories.find((category) => category.slug === slug)?.name ?? slug
  );
  const message = buildTripInquiryMessage(
    trip, routeId, process.env.NEXT_PUBLIC_SITE_URL || "https://e-goto.my.id"
  );
  const whatsapp = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    : null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#031e22]/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="trip-modal-title"
        className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] bg-white text-ink shadow-2xl sm:max-h-[90dvh] sm:rounded-[28px] lg:flex-row">
        <div className="relative h-56 w-full shrink-0 bg-[#184d50] sm:h-72 lg:h-auto lg:min-h-[480px] lg:w-[48%]">
          <Image src={gallery[photoIndex]?.src ?? trip.coverImage.src}
            alt={gallery[photoIndex]?.alt ?? trip.name} fill sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover"/>
          {gallery.length > 1 ? (
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
              <button type="button" onClick={()=>setPhotoIndex((i)=>(i+gallery.length-1)%gallery.length)}
                aria-label="Gambar sebelumnya" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink">
                <ChevronLeft aria-hidden="true"/>
              </button>
              <span className="rounded-full bg-[#061f25]/60 px-3 py-1 text-xs text-white">{photoIndex + 1} / {gallery.length}</span>
              <button type="button" onClick={()=>setPhotoIndex((i)=>(i+1)%gallery.length)}
                aria-label="Gambar berikutnya" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink">
                <ChevronRight aria-hidden="true"/>
              </button>
            </div>
          ) : null}
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col">
          <button type="button" ref={closeRef} aria-label="Tutup detail trip" onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-accent">
            <X className="h-5 w-5" aria-hidden="true"/>
          </button>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-16 sm:px-8 sm:pb-8">
            <h3 id="trip-modal-title" className="pr-8 font-serif text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
              {trip.name}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tagNames.map((name) => <span key={name} className="rounded-full bg-[#d5e5e5] px-3 py-1 text-xs font-bold">{name}</span>)}
            </div>
            {trip.location ? <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted"><MapPin className="h-4 w-4"/>{trip.location}</p> : null}
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink-muted">
              {trip.description || "Hubungi tim E-GOTO untuk informasi destinasi dan itinerary perjalanan ini."}
            </p>
            {routes.length ? (
              <fieldset className="mt-7">
                <legend className="mb-3 text-sm font-bold">Pilih jalur (opsional)</legend>
                <div className="grid gap-2">
                  {[{id:"",name:"Belum tahu, ingin konsultasi",description:""},...routes].map((route)=>(
                    <label key={route.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${routeId===route.id?"border-ink bg-[#e6f3f2]":"border-ink/15 hover:bg-paper/50"}`}>
                      <input type="radio" name="trip-route" checked={routeId === route.id} onChange={()=>setRouteId(route.id)} className="h-4 w-4 accent-[#064e4f]"/>
                      <span><span className="font-semibold">{route.name}</span>{route.description ? <span className="mt-1 block text-xs text-ink-muted">{route.description}</span> : null}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <p className="mt-5 text-xs text-ink-muted">Jadwal dan harga akan dikonfirmasi oleh admin via WhatsApp.</p>
          </div>
          <div className="shrink-0 border-t border-ink/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#087a5c] px-4 text-center text-sm font-bold text-white transition-colors hover:bg-[#075b48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <MessageCircle className="h-5 w-5" aria-hidden="true"/> Tanya Trip via WhatsApp
              </a>
            ) : <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">Nomor WhatsApp E-GOTO belum dikonfigurasi.</p>}
          </div>
        </div>
      </div>
    </div>, document.body
  );
}
