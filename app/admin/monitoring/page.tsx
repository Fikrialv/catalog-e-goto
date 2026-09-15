import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MonitoringDashboard } from "@/components/admin/monitoring-dashboard";
import { LogoutButton } from "@/components/admin/logout-button";
import { requireAdmin } from "@/services/auth";
import { getMonitoringSummary } from "@/services/monitoring";

export default async function AdminMonitoringPage() {
  const user = await requireAdmin();
  const summary = await getMonitoringSummary();

  return (
    <main className="catalog-surface min-h-screen px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard admin
            </Link>
            <p className="eyebrow mt-10">Admin monitoring</p>
            <h1 className="mt-3 font-serif text-5xl tracking-[-0.055em] text-ink">
              Pantau minat trip.
            </h1>
            <p className="mt-3 text-sm text-ink-muted">{user.email}</p>
          </div>
          <LogoutButton />
        </header>
        <MonitoringDashboard summary={summary} />
      </div>
    </main>
  );
}
