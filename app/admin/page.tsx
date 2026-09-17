import { AdminFeatureHub } from "@/components/admin/admin-feature-hub";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { getMonitoringSummary } from "@/services/monitoring";
import { listVouchers } from "@/services/vouchers";
import type { MonitoringSummary } from "@/types/monitoring";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function emptyMonitoringSummary(): MonitoringSummary {
  return {
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    views: 0,
    departuresSelected: 0,
    whatsappClicks: 0,
    destinations: [],
    departures: [],
    recentEvents: [],
  };
}

export default async function AdminIndexPage() {
  const user = await requireAdmin();

  const [summaryResult, recordsResult, vouchersResult] = await Promise.allSettled([
    getMonitoringSummary(),
    (async () => {
      const repository = await getCatalogRepository();
      return repository.listAdmin();
    })(),
    listVouchers(),
  ]);

  if (summaryResult.status === "rejected") {
    console.error("Admin monitoring summary failed", summaryResult.reason);
  }
  if (recordsResult.status === "rejected") {
    console.error("Admin catalog summary failed", recordsResult.reason);
  }
  if (vouchersResult.status === "rejected") {
    console.error("Admin voucher summary failed", vouchersResult.reason);
  }

  const summary =
    summaryResult.status === "fulfilled"
      ? summaryResult.value
      : emptyMonitoringSummary();
  const records =
    recordsResult.status === "fulfilled" ? recordsResult.value : [];
  const vouchers =
    vouchersResult.status === "fulfilled" ? vouchersResult.value : [];

  return (
    <AdminFeatureHub
      user={user}
      summary={summary}
      tripCount={records.filter((record) => record.status === "published").length}
      voucherCount={vouchers.length}
    />
  );
}
