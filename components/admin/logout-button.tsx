"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="min-h-11 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink hover:border-ink/35 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Keluar…" : "Keluar"}
    </button>
  );
}
