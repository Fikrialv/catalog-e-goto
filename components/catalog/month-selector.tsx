"use client";

import { cn } from "@/lib/utils";
import type { CatalogMonth } from "@/types/catalog";

export function MonthSelector({
  selectedMonth,
  onSelect,
  months,
}: {
  selectedMonth: string;
  onSelect: (month: string) => void;
  months: CatalogMonth[];
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Pilih katalog bulanan"
    >
      {months.map((month) => {
        const selected = selectedMonth === month.key;
        return (
          <button
            key={month.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(month.key)}
            className={cn(
              "min-h-12 shrink-0 rounded-full border px-5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
              selected
                ? "border-primary-dark bg-primary-dark text-white"
                : "border-ink/12 bg-white text-ink-muted hover:-translate-y-0.5 hover:border-primary/50 hover:text-ink",
            )}
          >
            {month.label}
          </button>
        );
      })}
    </div>
  );
}
