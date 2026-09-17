import Link from "next/link";
import { Activity, ArrowLeft, Plus } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { LogoutButton } from "@/components/admin/logout-button";
import type { CatalogRecord } from "@/types/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;

  let records: CatalogRecord[] = [];
  let catalogError = "";

  try {
    const repository = await getCatalogRepository();
    records = await repository.listAdmin();
  } catch (error) {
    console.error("Admin catalog list failed", error);
    catalogError =
      error instanceof Error
        ? error.message
        : "Data katalog tidak dapat dimuat saat ini.";
  }

  return (
    <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-5 border-b border-ink/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard admin
            </Link>
            <p className="eyebrow mt-10">Admin catalog</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">
              Kelola informasi trip.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
              {user.email} · {user.role} · Supabase Auth
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/monitoring"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-bold text-ink hover:border-ink/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              Monitoring
            </Link>
            <Link
              href="/admin/vouchers"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-bold text-ink hover:border-ink/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Voucher
            </Link>
            <LogoutButton />
            <Link
              href="/admin/catalog/new"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Trip baru
            </Link>
          </div>
        </header>
        {params.error === "forbidden" ? (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            Akun Anda tidak memiliki akses untuk aksi tersebut.
          </p>
        ) : null}
        {catalogError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            Data katalog belum dapat dimuat: {catalogError}
          </p>
        ) : null}
        <AdminDashboard records={records} canEdit={user.role !== "VIEWER"} />
      </div>
    </main>
  );
}
