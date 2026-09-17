import { createHmac } from "node:crypto";
import {
  getDiscountedPriceAmount,
  getDestinationHighlights,
} from "@/lib/catalog-utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeVoucherCode } from "@/lib/voucher-validation";
import type { PriceOption, TripDestination } from "@/types/catalog";
import type { Voucher, VoucherRedemption } from "@/types/voucher";

type VoucherRow = {
  id: string;
  code_preview: string;
  destination_id: string;
  destination_name: string;
  amount: number;
  usage_limit: number;
  redeemed_count: number;
  status: Voucher["status"];
  created_at: string;
};

type VoucherRedemptionRow = {
  id: string;
  voucher_id: string;
  amount: number | string;
  final_amount: number | string;
};

function voucherSecret() {
  const secret = process.env.VOUCHER_HASH_SECRET;
  if (!secret) throw new Error("Voucher belum dikonfigurasi.");
  return secret;
}

function hashCode(code: string) {
  return createHmac("sha256", voucherSecret())
    .update(normalizeVoucherCode(code))
    .digest("hex");
}

function codePreview(code: string) {
  const normalized = normalizeVoucherCode(code);
  return `${normalized.slice(0, 3)}•••${normalized.slice(-2)}`;
}

function fromRow(row: VoucherRow): Voucher {
  return {
    id: row.id,
    codePreview: row.code_preview,
    destinationId: row.destination_id,
    destinationName: row.destination_name,
    amount: row.amount,
    usageLimit: row.usage_limit,
    redeemedCount: row.redeemed_count,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listVouchers() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row as VoucherRow));
}

export async function createVoucher(input: {
  code: string;
  destination: TripDestination;
  amount: number;
  usageLimit: number;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { error } = await supabase.from("vouchers").insert({
    id: hashCode(input.code),
    code_preview: codePreview(input.code),
    destination_id: input.destination.id,
    destination_name: input.destination.name,
    amount: input.amount,
    usage_limit: input.usageLimit,
    redeemed_count: 0,
    status: "active",
  });
  if (error?.code === "23505") throw new Error("Kode voucher sudah digunakan.");
  if (error) throw error;
}

function priceAfterPromotion(destination: TripDestination, price: PriceOption) {
  return getDestinationHighlights(destination).reduce(
    (lowest, offer) =>
      Math.min(lowest, getDiscountedPriceAmount(price, offer)),
    price.amount,
  );
}

export async function redeemVoucher(input: {
  code: string;
  destination: TripDestination;
  price: PriceOption;
  sessionId: string;
}) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");

  const { data, error } = await supabase.rpc("redeem_catalog_voucher", {
    p_voucher_id: hashCode(input.code),
    p_destination_id: input.destination.id,
    p_session_id: input.sessionId,
    p_price_id: input.price.id,
    p_base_amount: priceAfterPromotion(input.destination, input.price),
  });

  if (error) throw new Error(error.message);

  const row = data?.[0] as VoucherRedemptionRow | undefined;
  if (!row) throw new Error("Voucher tidak dapat digunakan.");

  const amount = Number(row.amount);
  const finalAmount = Number(row.final_amount);

  if (!Number.isFinite(amount) || !Number.isFinite(finalAmount)) {
    throw new Error("Nominal voucher tidak valid. Silakan coba lagi.");
  }

  return {
    id: row.id,
    voucherId: row.voucher_id,
    amount,
    finalAmount,
  } satisfies VoucherRedemption;
}
