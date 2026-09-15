"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, FilePenLine, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CatalogRecord } from "@/types/catalog";
import { formatMonthLabel } from "@/lib/format";
import { monthKeyFromDate } from "@/lib/catalog-utils";

function getAdminMonthTabs(records: CatalogRecord[]) {
  const scheduleMonths = records.flatMap((record) =>
    record.draft.schedules.map((schedule) =>
      monthKeyFromDate(schedule.startDate),
    ),
  );
  const keys = [...new Set(scheduleMonths)].sort();
  return keys.map((key) => ({ key, label: formatMonthLabel(key) }));
}

export function AdminDashboard({
  records,
  canEdit,
}: {
  records: CatalogRecord[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const monthTabs = getAdminMonthTabs(records);
  const [selectedMonth, setSelectedMonth] = useState(monthTabs[0]?.key ?? "");
  const filteredRecords = records.filter((record) =>
    record.draft.schedules.some(
      (schedule) => monthKeyFromDate(schedule.startDate) === selectedMonth,
    ),
  );
  async function restore(id: string) {
    if (!window.confirm("Pulihkan destination ini sebagai draft?")) return;
    await fetch(`/api/admin/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", confirmed: true }),
    });
    router.refresh();
  }

  return (
    <section className="mt-10" aria-labelledby="admin-destination-list">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content inventory</p>
          <h2
            id="admin-destination-list"
            className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink"
          >
            {filteredRecords.length} destination
          </h2>
        </div>
        <p className="text-sm text-ink-muted">
          Draft tersimpan terpisah dari public
        </p>
      </div>
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Pilih bulan untuk mengelola katalog"
      >
        {monthTabs.map((month) => (
          <button
            key={month.key}
            type="button"
            role="tab"
            aria-selected={selectedMonth === month.key}
            onClick={() => setSelectedMonth(month.key)}
            className={`min-h-11 shrink-0 rounded-full border px-5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${selectedMonth === month.key ? "border-primary bg-primary text-ink" : "border-ink/12 bg-white text-ink-muted hover:-translate-y-0.5 hover:border-primary/50 hover:text-ink"}`}
          >
            {month.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {filteredRecords.map((record, index) => (
          <article
            key={record.id}
            className="rounded-[1.35rem] border border-ink/10 bg-white p-5 shadow-[0_10px_35px_rgba(25,48,39,0.05)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-muted">
                  #{String(index + 1).padStart(2, "0")} · {record.status}
                </p>
                <h3 className="mt-2 font-serif text-2xl tracking-[-0.035em] text-ink">
                  {record.draft.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  /{record.draft.slug}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${record.status === "published" ? "bg-emerald-50 text-emerald-800" : record.status === "archived" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}
              >
                {record.status}
              </span>
            </div>
            <div className="mt-5 grid gap-2 text-sm text-ink-muted sm:grid-cols-3">
              <span>Draft v{record.draftVersion}</span>
              <span>Public v{record.publishedVersion}</span>
              <span>
                Updated {new Date(record.updatedAt).toLocaleDateString("id-ID")}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {canEdit ? (
                <Link
                  href={`/admin/catalog/${record.id}/edit?month=${selectedMonth}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <FilePenLine className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              ) : null}
              {record.published ? (
                <Link
                  href={`/catalog/${record.published.slug}`}
                  target="_blank"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink hover:border-ink/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Public
                </Link>
              ) : null}
              {canEdit && record.status === "archived" ? (
                <button
                  type="button"
                  onClick={() => restore(record.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Restore
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!filteredRecords.length ? (
        <div className="mt-6 rounded-[1.35rem] border border-dashed border-ink/20 bg-white px-6 py-12 text-center">
          <p className="font-serif text-2xl tracking-[-0.03em] text-ink">
            Belum ada data untuk bulan ini.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Tambahkan jadwal dengan tanggal pada bulan yang dipilih melalui menu
            edit destination.
          </p>
        </div>
      ) : null}
    </section>
  );
}
