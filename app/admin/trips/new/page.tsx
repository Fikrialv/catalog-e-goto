import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { ListTripEditor } from "@/components/admin/list-trip-editor";
import { getAdminListTripCategories } from "@/services/list-trip-categories";
import type { ListTripRecord } from "@/types/list-trip";
import { newListTrip } from "@/lib/list-trip-validation";

export default async function NewTripPage() {
  await requireAdmin(["ADMIN", "EDITOR"]);
  const payload = newListTrip();
  const categories = await getAdminListTripCategories();
  const record: ListTripRecord = {
    id: payload.id,
    slug: payload.slug,
    status: "draft",
    draft: payload,
    published: null,
    draftVersion: 0,
    publishedVersion: 0,
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
          <ListTripEditor record={record} categories={categories} isNew />
        </div>
      </div>
    </main>
  );
}
