export const dynamic = "force-dynamic";

import Link from "next/link";
import { SiteHeader } from "@/components/site/site-header";
import { ListTripSection } from "@/components/catalog/list-trip-section";
import { getPublicListTrips } from "@/services/list-trips";
import { getPublicListTripCategories } from "@/services/list-trip-categories";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Trip | E-GOTO",
  description: "Jelajahi seluruh trip E-GOTO, temukan pilihan jalur, dan tanyakan perjalanan meski belum ada jadwal keberangkatan.",
};

export default async function TripsPage() {
  const [destinations, categories] = await Promise.all([
    getPublicListTrips(),
    getPublicListTripCategories(),
  ]);
  return (
    <main className="landing-surface min-h-screen">
      <div className="relative min-h-36 bg-[#d5e5e5]">
        <SiteHeader />
      </div>
      <ListTripSection destinations={destinations} categories={categories} />
      <div className="bg-[#e6f3f2] px-5 pb-16 text-center">
        <Link href="/catalog" className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 text-sm font-bold text-white">
          Lihat Catalog Jadwal Berangkat
        </Link>
      </div>
    </main>
  );
}
