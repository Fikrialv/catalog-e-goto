"use client";

import { useState } from "react";
import { Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import type { TripDestination } from "@/types/catalog";
import type { Voucher } from "@/types/voucher";
import { VOUCHER_DISCOUNT_OPTIONS } from "@/lib/voucher-validation";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function VoucherDashboard({ destinations, vouchers, canEdit }: { destinations: TripDestination[]; vouchers: Voucher[]; canEdit: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? "");
  const [amount, setAmount] = useState("50000");
  const [usageLimit, setUsageLimit] = useState("10");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, destinationId, amount, usageLimit }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? ((await response.json()) as { message?: string })
        : { message: (await response.text()).trim() };

      if (!response.ok) {
        if (response.status === 401) {
          setMessage(result.message || "Sesi admin berakhir. Silakan login ulang.");
          return;
        }
        setMessage(result.message || `Voucher gagal dibuat (HTTP ${response.status}).`);
        return;
      }

      setMessage(`Voucher ${code} dibuat. Simpan atau bagikan kode ini sekarang; daftar hanya menampilkan kode tersamarkan.`);
      setCode("");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Permintaan gagal: ${error.message}`
          : "Permintaan ke server gagal. Coba muat ulang halaman.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={create} className="rounded-[1.5rem] border border-ink/10 bg-primary-soft p-6 sm:p-7">
        <div className="flex items-center gap-2 text-ink"><Plus className="h-5 w-5" aria-hidden="true" /><h2 className="font-serif text-3xl tracking-[-0.04em]">Buat kode voucher</h2></div>
        <p className="mt-3 text-sm leading-6 text-ink-muted">Pilih nominal potongan voucher yang sudah ditetapkan.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-ink">Kode<input required value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="E-GOTO-HEMAT" className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 font-semibold uppercase outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" /></label>
          <label className="block text-sm font-bold text-ink">Trip<select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">{destinations.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-bold text-ink">Potongan (Rp)<select required value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 outline-none tabular-nums">{VOUCHER_DISCOUNT_OPTIONS.map((value) => <option key={value} value={value}>{rupiah.format(value)}</option>)}</select></label><label className="block text-sm font-bold text-ink">Limit pakai<input required min="1" type="number" value={usageLimit} onChange={(event) => setUsageLimit(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-ink/15 bg-white px-3 outline-none" /></label></div>
        </div>
        {message ? <p role="status" className="mt-4 text-sm font-semibold text-ink">{message}</p> : null}
        {canEdit ? <button disabled={loading || !destinations.length} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white disabled:opacity-50"><Ticket className="h-4 w-4" aria-hidden="true" />{loading ? "Membuat…" : "Buat voucher"}</button> : <p className="mt-6 text-sm text-ink-muted">Akses view-only: kode tidak dapat dibuat.</p>}
      </form>
      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-6 sm:p-7">
        <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Voucher inventory</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.04em]">Kode aktif</h2></div><span className="text-sm font-semibold text-ink-muted">{vouchers.length} kode</span></div>
        {vouchers.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink-muted"><tr><th className="pb-3">Kode</th><th className="pb-3">Trip</th><th className="pb-3 text-right">Potongan</th><th className="pb-3 text-right">Terpakai</th></tr></thead><tbody>{vouchers.map((voucher) => <tr key={voucher.id} className="border-b border-ink/8 last:border-0"><td className="py-4 font-semibold text-ink">{voucher.codePreview}</td><td className="py-4 text-ink-muted">{voucher.destinationName}</td><td className="py-4 text-right font-semibold text-ink">{rupiah.format(voucher.amount)}</td><td className="py-4 text-right tabular-nums text-ink-muted">{voucher.redeemedCount} / {voucher.usageLimit}</td></tr>)}</tbody></table></div> : <p className="mt-6 text-sm leading-6 text-ink-muted">Belum ada kode. Buat kode pertama untuk trip yang sudah dipublikasikan.</p>}
      </section>
    </section>
  );
}
