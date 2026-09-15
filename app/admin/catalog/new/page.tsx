import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { CatalogEditor } from "@/components/admin/catalog-editor";
import type { CatalogRecord, TripDestination } from "@/types/catalog";

function blankDestination(monthKey: string): TripDestination {
  const id = `destination-${Date.now()}`;
  return {
    id,
    slug: "destination-baru",
    name: "Destination baru",
    category: "mountain",
    duration: "2 Hari 1 Malam",
    description: "",
    coverImage: {
      src: "/images/tumpak sewu.avif",
      alt: "Gambar destination",
      sortOrder: 1,
    },
    gallery: [],
    prices: [
      { id: "price-1", label: "Meeting point", amount: 1, sortOrder: 1 },
    ],
    schedules: [
      {
        id: `schedule-${Date.now()}`,
        destinationId: id,
        startDate: `${monthKey}-01`,
        endDate: null,
        publicationStatus: "draft",
        availabilityStatus: "available",
      },
    ],
    includes: [],
    excludes: [],
    notes: [],
    itinerary: [],
    highlights: [],
    publicationStatus: "draft",
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    publishedVersion: 0,
  };
}

export default async function NewCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdmin(["ADMIN", "EDITOR"]);
  const { month } = await searchParams;
  const monthKey = /^\d{4}-\d{2}$/.test(month ?? "")
    ? month!
    : new Date().toISOString().slice(0, 7);
  const payload = blankDestination(monthKey);
  const record: CatalogRecord = {
    id: payload.id,
    slug: payload.slug,
    status: "draft",
    draft: payload,
    published: null,
    draftVersion: 0,
    publishedVersion: 0,
    publishedAt: null,
    updatedAt: payload.updatedAt,
  };
  return (
    <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard
        </Link>
        <p className="eyebrow mt-10">New destination</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">
          Buat trip baru.
        </h1>
        <div className="mt-10">
          <CatalogEditor record={record} isNew />
        </div>
      </div>
    </main>
  );
}
