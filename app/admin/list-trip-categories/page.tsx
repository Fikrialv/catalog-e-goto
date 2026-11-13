import Link from "next/link";
import { requireAdmin } from "@/services/auth";
import { getAdminListTripCategories } from "@/services/list-trip-categories";
import { TripCategoryManager } from "@/components/admin/trip-category-manager";

export const dynamic="force-dynamic";
export default async function ListTripCategoriesPage(){
  await requireAdmin(["ADMIN"]);
  const categories=await getAdminListTripCategories();
  return <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
    <div className="mx-auto max-w-[1200px]">
      <Link href="/admin/trips" className="text-sm font-semibold underline underline-offset-4">Kembali ke Kelola Trip</Link>
      <p className="eyebrow mt-10">List Trip · kategori mandiri</p>
      <h1 className="mt-3 font-serif text-5xl">Kelola kategori List Trip</h1>
      <p className="mt-3 text-sm text-ink-muted">Kategori ini hanya untuk List Trip. Tidak mengubah filter kategori Catalog.</p>
      <TripCategoryManager initial={categories} endpoint="/api/admin/list-trip-categories"/>
    </div>
  </main>;
}
