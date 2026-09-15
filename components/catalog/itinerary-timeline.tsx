import { Clock3 } from "lucide-react";
import type { ItineraryDay } from "@/types/catalog";
import { useCustomerPreferences } from "@/components/site/customer-preferences";

export function ItineraryTimeline({
  itinerary,
}: {
  itinerary: ItineraryDay[];
}) {
  const { language } = useCustomerPreferences();
  return (
    <div className="space-y-10">
      {itinerary.map((day) => (
        <section key={day.dayNumber} aria-labelledby={`day-${day.dayNumber}`}>
          <div className="mb-5 flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
              0{day.dayNumber}
            </span>
            <div>
              <p className="eyebrow">
                {language === "en" ? "Day" : "Hari"} {day.dayNumber}
              </p>
              <h3
                id={`day-${day.dayNumber}`}
                className="mt-1 font-serif text-2xl tracking-[-0.03em] text-ink"
              >
                {day.title}
              </h3>
            </div>
          </div>
          <ol className="ml-5 border-l border-ink/12 pl-6 sm:ml-5 sm:pl-8">
            {day.items.map((item) => (
              <li
                key={`${day.dayNumber}-${item.time}-${item.activity}`}
                className="relative grid gap-2 pb-6 last:pb-0 sm:grid-cols-[88px_1fr] sm:gap-5"
              >
                <span
                  className="absolute -left-[calc(1.5rem+5px)] top-1 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent sm:-left-[calc(2rem+5px)]"
                  aria-hidden="true"
                />
                <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-ink">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.time}
                </span>
                <span className="text-sm leading-6 text-ink sm:text-base">
                  {item.activity}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
