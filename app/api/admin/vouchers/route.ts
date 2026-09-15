import { NextResponse } from "next/server";
import { createVoucherSchema } from "@/lib/voucher-validation";
import { getPublishedDestinations } from "@/services/catalog";
import { requireAdmin } from "@/services/auth";
import { createVoucher } from "@/services/vouchers";

export async function POST(request: Request) {
  await requireAdmin(["ADMIN", "EDITOR"]);
  const parsed = createVoucherSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Data voucher tidak valid." }, { status: 400 });
  const destination = (await getPublishedDestinations()).find((item) => item.id === parsed.data.destinationId);
  if (!destination) return NextResponse.json({ message: "Trip tidak ditemukan atau belum dipublikasikan." }, { status: 400 });
  const lowestPrice = Math.min(...destination.prices.map((price) => price.amount));
  if (parsed.data.amount > lowestPrice) {
    return NextResponse.json({ message: "Potongan voucher tidak boleh melebihi harga trip terendah." }, { status: 400 });
  }
  try {
    await createVoucher({ ...parsed.data, destination });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Voucher gagal dibuat." }, { status: 400 });
  }
}
