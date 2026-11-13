import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/services/auth";
import { getAdminTripCategories } from "@/services/trip-categories";
import { TripCategoryManager } from "@/components/admin/trip-category-manager";

export const dynamic = "force-dynamic";

export default async function AdminTripCategoriesPage() {
  await requireAdmin(["ADMIN"]);
  const categories = await getAdminTripCategories();
  return (
    <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        <Link href="/admin/catalog" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true"/> Kembali ke katalog admin
        </Link>
        <p className="eyebrow mt-10">List Trip · Admin</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">Kelola Kategori Trip</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
          Tambah dan atur kategori destinasi tanpa mengubah jadwal, harga, atau voucher yang telah dipublikasikan.
        </p>
        <TripCategoryManager initial={categories}/>
      </div>
    </main>
  );
}
