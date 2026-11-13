import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { CatalogEditor } from "@/components/admin/catalog-editor";
import { getAdminTripCategories } from "@/services/trip-categories";
import type { CatalogRecord } from "@/types/catalog";
import { createBlankMasterTrip } from "@/lib/trip-drafts";

export default async function NewTripPage() {
  await requireAdmin(["ADMIN", "EDITOR"]);
  const payload = createBlankMasterTrip();
  const categories = await getAdminTripCategories();
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
          href="/admin/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke dashboard
        </Link>
        <p className="eyebrow mt-10">List Trip · Master Data</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">
          Tambah Master Trip dan jalur.
        </h1>
        <div className="mt-10">
          <CatalogEditor record={record} categories={categories} isNew mode="trip" />
        </div>
      </div>
    </main>
  );
}
