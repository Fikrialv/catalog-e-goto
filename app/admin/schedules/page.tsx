import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { CatalogRecord } from "@/types/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSchedulesPage() {
  const user = await requireAdmin();
  let records: CatalogRecord[] = [];
  let errorMessage = "";
  try {
    const repository = await getCatalogRepository();
    records = await repository.listAdmin();
  } catch (error) {
    console.error("Admin schedules loading failed", error);
    errorMessage = "Data jadwal belum bisa dimuat. Silakan periksa koneksi database.";
  }
  return (
    <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/admin/catalog" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Kembali ke List Trip
        </Link>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin jadwal</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">Kelola jadwal keberangkatan.</h1>
            <p className="mt-3 text-sm text-ink-muted">Jadwal terhubung dengan master trip. Hanya jadwal Published, Available, dan mendatang muncul di Catalog publik.</p>
          </div>
          {user.role !== "VIEWER" ? (
            <Link href="/admin/catalog/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Trip baru
            </Link>
          ) : null}
        </div>
        {errorMessage ? <p role="alert" className="mt-6 text-red-700">{errorMessage}</p> : null}
        <AdminDashboard records={records} canEdit={user.role !== "VIEWER"} mode="schedules" />
      </div>
    </main>
  );
}
