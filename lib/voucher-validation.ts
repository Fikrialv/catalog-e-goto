import { z } from "zod";

export const voucherCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{6,32}$/, "Kode harus 6–32 karakter: huruf, angka, atau -.");

export const createVoucherSchema = z.object({
  code: voucherCodeSchema,
  destinationId: z.string().min(1).max(160),
  amount: z.coerce.number().int().min(1_000).max(10_000_000),
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
