import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/services/auth";
import { getAdminListTrip } from "@/services/list-trips";
import { ListTripEditor } from "@/components/admin/list-trip-editor";
import { getAdminListTripCategories } from "@/services/list-trip-categories";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await (async () => {
    await requireAdmin(["ADMIN", "EDITOR"]);
    return getAdminListTrip(id);
  })();
  if (!record) notFound();
  const categories = await getAdminListTripCategories();
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
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">List Trip · Master Data</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">
              {record.draft.name}
            </h1>
          </div>
          <p className="text-sm text-ink-muted">Status: {record.status}</p>
        </div>
        <div className="mt-10">
          <ListTripEditor record={record} categories={categories} />
        </div>
      </div>
    </main>
  );
}
