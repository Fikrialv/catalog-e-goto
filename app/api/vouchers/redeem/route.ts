import { NextResponse } from "next/server";
import { redeemVoucherSchema } from "@/lib/voucher-validation";
import { getDestinationBySlug } from "@/services/catalog";
import { redeemVoucher } from "@/services/vouchers";

export async function POST(request: Request) {
  const parsed = redeemVoucherSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Kode voucher tidak valid." }, { status: 400 });
  const destination = await getDestinationBySlug(parsed.data.destinationSlug);
  const price = destination?.prices.find((item) => item.id === parsed.data.priceId);
  if (!destination || !price) return NextResponse.json({ message: "Trip atau titik keberangkatan tidak tersedia." }, { status: 400 });
  try {
    const redemption = await redeemVoucher({ ...parsed.data, destination, price });
    return NextResponse.json({ ok: true, redemption });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Voucher tidak dapat digunakan." }, { status: 400 });
  }
}
