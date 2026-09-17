from pathlib import Path

editor = Path("components/admin/catalog-editor.tsx")
text = editor.read_text()

old_price_change = '''                      onChange={(event) =>
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          priceId: event.target.value,
                        }))
                      }'''
new_price_change = '''                      onChange={(event) => {
                        const nextPriceId = event.target.value;
                        const nextPrice = payload.prices.find(
                          (price) => price.id === nextPriceId,
                        );
                        updateHighlight(highlight.id, (current) => {
                          const cut = Math.min(
                            200000,
                            Math.max(5000, current.discountValue ?? 50000),
                          );
                          return {
                            ...current,
                            priceId: nextPriceId,
                            discountType: "fixed",
                            discountValue: cut,
                            discountAmount: Math.max(
                              0,
                              (nextPrice?.amount ?? 0) - cut,
                            ),
                          };
                        });
                      }}'''
if old_price_change not in text:
    raise SystemExit("meeting point change block not found")
text = text.replace(old_price_change, new_price_change, 1)

old_discount = '''                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Harga discount (Rp)</span>
                    <input
                      inputMode="numeric"
                      value={
                        highlight.discountAmount
                          ? `Rp ${highlight.discountAmount.toLocaleString("id-ID")}`
                          : ""
                      }
                      onChange={(event) => {
                        const amount =
                          Number(event.target.value.replace(/\\D/g, ""));
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          discountAmount: amount,
                        }));
                      }}
                      className={`${inputClass} tabular-nums`}
                    />
                  </label>'''
new_discount = '''                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    <span>Potongan discount (Rp)</span>
                    <select
                      value={String(highlight.discountValue ?? 50000)}
                      onChange={(event) => {
                        const cut = Number(event.target.value);
                        const normalPrice = payload.prices.find(
                          (price) => price.id === highlight.priceId,
                        );
                        updateHighlight(highlight.id, (current) => ({
                          ...current,
                          discountType: "fixed",
                          discountValue: cut,
                          discountAmount: Math.max(
                            0,
                            (normalPrice?.amount ?? 0) - cut,
                          ),
                        }));
                      }}
                      className={`${inputClass} tabular-nums`}
                    >
                      {Array.from({ length: 40 }, (_, index) =>
                        (index + 1) * 5000,
                      ).map((value) => (
                        <option key={value} value={value}>
                          Rp {value.toLocaleString("id-ID")}
                        </option>
                      ))}
                    </select>
                  </label>'''
if old_discount not in text:
    raise SystemExit("highlight discount input block not found")
text = text.replace(old_discount, new_discount, 1)
editor.write_text(text)

validation = Path("lib/validation.ts")
text = validation.read_text()
old_value = '  discountValue: z.number().positive().optional(),'
new_value = '''  discountValue: z
    .number()
    .int()
    .min(5_000, "Potongan highlight minimal Rp5.000.")
    .max(200_000, "Potongan highlight maksimal Rp200.000.")
    .refine((value) => value % 5_000 === 0, {
      message: "Potongan highlight harus kelipatan Rp5.000.",
    })
    .optional(),'''
if old_value not in text:
    raise SystemExit("discountValue schema not found")
text = text.replace(old_value, new_value, 1)

marker = '''      const path = ["highlights", index];
      if (!normalPrice) {'''
replacement = '''      const path = ["highlights", index];
      if (
        offer.discountType !== "fixed" ||
        !offer.discountValue ||
        offer.discountValue < 5_000 ||
        offer.discountValue > 200_000 ||
        offer.discountValue % 5_000 !== 0
      ) {
        context.addIssue({
          code: "custom",
          path: [...path, "discountValue"],
          message:
            "Potongan highlight harus Rp5.000–Rp200.000 dan kelipatan Rp5.000.",
        });
      }
      if (!normalPrice) {'''
if marker not in text:
    raise SystemExit("highlight validation marker not found")
text = text.replace(marker, replacement, 1)
validation.write_text(text)
