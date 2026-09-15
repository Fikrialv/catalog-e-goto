"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Login gagal.");
      setLoading(false);
      return;
    }
    router.replace(result.redirectTo ?? "/admin");
  }

  return (
    <main className="catalog-surface grid min-h-screen place-items-center px-5 py-16 sm:px-8">
      <section
        className="w-full max-w-md rounded-[1.5rem] bg-white p-7 shadow-[0_18px_60px_rgba(25,48,39,0.12)] sm:p-9"
        aria-labelledby="admin-login-title"
      >
        <p className="eyebrow">E-GOTO CMS</p>
        <h1
          id="admin-login-title"
          className="mt-3 font-serif text-4xl tracking-[-0.05em] text-ink"
        >
          Masuk ke katalog.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-muted">
          Kelola informasi trip, jadwal, harga, dan status publish.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="grid gap-2 text-sm font-semibold text-ink">
            <span>Username / email</span>
            <input
              required
              type="text"
              autoComplete="username"
              spellCheck={false}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="min-h-12 rounded-xl border border-ink/15 bg-paper px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-ink">
            <span>Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 rounded-xl border border-ink/15 bg-paper px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
            >
              {error}
            </p>
          ) : null}
          <button
            disabled={loading}
            className="min-h-12 w-full rounded-full bg-ink px-5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {loading ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          Kembali ke public catalog
        </Link>
      </section>
    </main>
  );
}
