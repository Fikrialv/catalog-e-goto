import { NextResponse } from "next/server";
import { createVoucherSchema } from "@/lib/voucher-validation";
import { getPublishedDestinations } from "@/services/catalog";
import { getCurrentUser } from "@/services/auth";
import { createVoucher } from "@/services/vouchers";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Sesi admin sudah berakhir. Silakan login ulang." },
        { status: 401 },
      );
    }
    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { message: "Akun ini tidak memiliki izin membuat voucher." },
        { status: 403 },
      );
    }

    const parsed = createVoucherSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ?? "Data voucher tidak valid.",
        },
        { status: 400 },
      );
    }

    const destination = (await getPublishedDestinations()).find(
      (item) => item.id === parsed.data.destinationId,
    );
    if (!destination) {
      return NextResponse.json(
        { message: "Trip tidak ditemukan atau belum dipublikasikan." },
        { status: 400 },
      );
    }

    const lowestPrice = Math.min(
      ...destination.prices.map((price) => price.amount),
    );
    if (parsed.data.amount > lowestPrice) {
      return NextResponse.json(
        { message: "Potongan voucher tidak boleh melebihi harga trip terendah." },
        { status: 400 },
      );
    }

    await createVoucher({ ...parsed.data, destination });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Voucher creation failed", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Voucher gagal dibuat karena server mengalami kesalahan.",
      },
      { status: 500 },
    );
  }
}
