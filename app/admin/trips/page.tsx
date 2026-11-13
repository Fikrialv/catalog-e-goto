import Link from "next/link";
import { Plus, CalendarDays, Tags } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { getAdminListTrips } from "@/services/list-trips";
import type { ListTripRecord } from "@/types/list-trip";
import { ListTripInventory } from "@/components/admin/list-trip-inventory";

export const dynamic="force-dynamic";
export const revalidate=0;
export default async function AdminTripsPage(){
  const user=await requireAdmin();
  let records:ListTripRecord[]=[];
  let error="";
  try {records=await getAdminListTrips();}
  catch(e){console.error("List Trip admin failed",e);error="List Trip belum bisa dimuat. Periksa koneksi Supabase.";}
  return <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1440px]">
      <Link href="/admin" className="text-sm font-semibold underline underline-offset-4">Kembali ke Dashboard Admin</Link>
      <header className="mt-9 flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-8">
        <div><p className="eyebrow">List Trip · fitur mandiri</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight">Kelola List Trip</h1>
          <p className="mt-3 text-sm text-ink-muted">CRUD destinasi, kategori, jalur, cover dan galeri. Tidak mengubah Catalog Jadwal.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/list-trip-categories" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-bold"><Tags className="h-4 w-4"/> Kategori List Trip</Link>
          <Link href="/admin/catalog" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-bold"><CalendarDays className="h-4 w-4"/> Catalog Jadwal</Link>
          {user.role!=="VIEWER"?<Link href="/admin/trips/new" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white"><Plus className="h-4 w-4"/> Tambah Trip</Link>:null}
        </div>
      </header>
      {error?<p role="alert" className="mt-6 text-red-700">{error}</p>:null}
      <ListTripInventory records={records} canEdit={user.role!=="VIEWER"}/>
    </div>
  </main>;
}
