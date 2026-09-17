"use client";

import { useState } from "react";
import { CheckCircle2, Ticket } from "lucide-react";
import {
  formatCustomerPrice,
  useCustomerPreferences,
} from "@/components/site/customer-preferences";
import { getCatalogSessionId } from "@/components/catalog/event-tracker";
import type { PriceOption, TripDestination } from "@/types/catalog";

type RedemptionResult = {
  amount: number;
  finalAmount: number;
  redemptionId: string;
};

export function VoucherRedemption({
  destination,
  price,
  onRedeemed,
}: {
  destination: TripDestination;
  price: PriceOption;
  onRedeemed: (result: RedemptionResult | null) => void;
}) {
  const { currency } = useCustomerPreferences();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function redeem() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          destinationSlug: destination.slug,
          priceId: price.id,
          sessionId: getCatalogSessionId(),
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        redemption?: {
          amount: number | string;
          finalAmount: number | string;
          id: string;
        };
      };
      if (!response.ok || !result.redemption) {
        throw new Error(result.message ?? "Voucher tidak dapat digunakan.");
      }

      const amount = Number(result.redemption.amount);
      const finalAmount = Number(result.redemption.finalAmount);
      if (!Number.isFinite(amount) || !Number.isFinite(finalAmount)) {
        throw new Error("Nominal voucher tidak valid. Silakan coba lagi.");
      }

      onRedeemed({
        amount,
        finalAmount,
        redemptionId: result.redemption.id,
      });
      setMessage(
        `Voucher aktif: potongan ${formatCustomerPrice(amount, currency)}. Harga setelah voucher ${formatCustomerPrice(finalAmount, currency)}.`,
      );
    } catch (error) {
      onRedeemed(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Voucher tidak dapat digunakan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink/10 bg-paper p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-ink">
        <Ticket className="h-4 w-4 text-accent" aria-hidden="true" />
        Punya kode voucher?
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          aria-label="Kode voucher"
          placeholder="MASUKKAN KODE"
          maxLength={32}
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 text-sm font-semibold uppercase text-ink outline-none placeholder:normal-case placeholder:font-normal placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="button"
          onClick={redeem}
          disabled={loading || code.trim().length < 6}
          className="min-h-11 rounded-xl bg-ink px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "Cek…" : "Gunakan"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-3 flex gap-2 text-xs leading-5 ${message.startsWith("Voucher aktif") ? "text-emerald-800" : "text-red-700"}`}
        >
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          {message}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-ink-muted">
          Jika tidak punya kode, lanjut chat WhatsApp langsung.
        </p>
      )}
    </div>
  );
}
