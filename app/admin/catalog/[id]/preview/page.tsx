import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { TripDetail } from "@/components/catalog/trip-detail";

export default async function PreviewCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await (async () => {
    await requireAdmin(["ADMIN", "EDITOR"]);
    const repository = await getCatalogRepository();
    return repository.getAdmin(id);
  })();
  if (!record) notFound();
  return (
    <main>
      <div className="fixed left-5 top-5 z-50">
        <Link
          href={`/admin/catalog/${id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-black/35 px-4 text-sm font-semibold text-white backdrop-blur-md"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke editor
        </Link>
      </div>
      <div className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-900">
        Preview draft — belum tampil public sampai Publish.
      </div>
      <TripDetail destination={record.draft} />
    </main>
  );
}
