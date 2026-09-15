"use client";

export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <main className="catalog-surface grid min-h-screen place-items-center px-5 py-24 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Catalog unavailable</p>
        <h1 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-ink">
          Katalog belum dapat dimuat.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          Silakan coba lagi untuk melihat informasi perjalanan.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 min-h-12 rounded-full bg-ink px-6 text-sm font-semibold text-paper transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
