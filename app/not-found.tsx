import Link from "next/link";

export default function NotFound() {
  return (
    <main className="catalog-surface flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 font-serif text-6xl tracking-[-0.05em] text-ink">
          Trip tidak ditemukan.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-ink-muted">
          Coba kembali ke katalog untuk melihat destination yang tersedia.
        </p>
        <Link
          href="/catalog"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary-dark px-6 text-sm font-bold text-white transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Kembali ke katalog
        </Link>
      </div>
    </main>
  );
}
