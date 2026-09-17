import { z } from "zod";

export const VOUCHER_DISCOUNT_OPTIONS = [
  25_000,
  50_000,
  100_000,
  125_000,
  150_000,
  175_000,
  200_000,
] as const;

export const voucherCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{6,32}$/, "Kode harus 6–32 karakter: huruf, angka, atau -.");

export const createVoucherSchema = z.object({
  code: voucherCodeSchema,
  destinationId: z.string().min(1).max(160),
  amount: z.coerce.number().int().refine(
    (value) => VOUCHER_DISCOUNT_OPTIONS.includes(
      value as (typeof VOUCHER_DISCOUNT_OPTIONS)[number],
    ),
    {
      message:
        "Potongan voucher harus salah satu dari Rp25.000, Rp50.000, Rp100.000, Rp125.000, Rp150.000, Rp175.000, atau Rp200.000.",
    },
  ),
  usageLimit: z.coerce.number().int().min(1).max(100_000),
});

export const redeemVoucherSchema = z.object({
  code: voucherCodeSchema,
  destinationSlug: z.string().min(2).max(120),
  priceId: z.string().min(1).max(160),
  sessionId: z.string().uuid(),
});

export function normalizeVoucherCode(code: string) {
  return code.trim().toUpperCase();
}
