import { AdminFeatureHub } from "@/components/admin/admin-feature-hub";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { getMonitoringSummary } from "@/services/monitoring";
import { listVouchers } from "@/services/vouchers";

export default async function AdminIndexPage() {
  const user = await requireAdmin();
  const repository = await getCatalogRepository();
  const [summary, records, vouchers] = await Promise.all([getMonitoringSummary(), repository.listAdmin(), listVouchers()]);
  return <AdminFeatureHub user={user} summary={summary} tripCount={records.filter((record) => record.status === "published").length} voucherCount={vouchers.length} />;
}
