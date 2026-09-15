import { BarChart3, MapPin, MessageCircle, Eye } from "lucide-react";
import type { MonitoringSummary } from "@/types/monitoring";

const number = new Intl.NumberFormat("id-ID");

export function MonitoringDashboard({
  summary,
}: {
  summary: MonitoringSummary;
}) {
  const conversion = summary.views
    ? Math.round((summary.whatsappClicks / summary.views) * 100)
    : 0;
  const stats = [
    { label: "Detail trip dilihat", value: summary.views, icon: Eye },
    {
      label: "Titik keberangkatan dipilih",
      value: summary.departuresSelected,
      icon: MapPin,
    },
    { label: "Klik WhatsApp", value: summary.whatsappClicks, icon: MessageCircle },
  ];

  return (
    <section className="mt-10" aria-labelledby="monitoring-title">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Catalog monitoring</p>
          <h2
            id="monitoring-title"
            className="mt-2 font-serif text-3xl tracking-[-0.04em] text-ink"
          >
            Minat pelanggan, 30 hari terakhir.
          </h2>
        </div>
        <p className="text-sm text-ink-muted">
          {conversion}% view menghasilkan klik WhatsApp
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article
              key={stat.label}
              className="rounded-[1.35rem] border border-ink/10 bg-white p-5 shadow-[0_10px_35px_rgba(25,48,39,0.05)]"
            >
              <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
              <p className="mt-6 text-3xl font-semibold tracking-[-0.045em] text-ink tabular-nums">
                {number.format(stat.value)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{stat.label}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.35rem] border border-ink/10 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" aria-hidden="true" />
            <h3 className="font-serif text-2xl tracking-[-0.035em] text-ink">
              Destinasi terpantau
            </h3>
          </div>
          {summary.destinations.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink-muted">
                  <tr>
                    <th className="pb-3 font-semibold">Destinasi</th>
                    <th className="pb-3 text-right font-semibold">Dilihat</th>
                    <th className="pb-3 text-right font-semibold">Dipilih</th>
                    <th className="pb-3 text-right font-semibold">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.destinations.map((destination) => (
                    <tr key={destination.destinationId} className="border-b border-ink/8 last:border-0">
                      <td className="py-4 font-semibold text-ink">
                        {destination.destinationName}
                      </td>
                      <td className="py-4 text-right tabular-nums text-ink-muted">
                        {number.format(destination.views)}
                      </td>
                      <td className="py-4 text-right tabular-nums text-ink-muted">
                        {number.format(destination.departuresSelected)}
                      </td>
                      <td className="py-4 text-right font-semibold tabular-nums text-ink">
                        {number.format(destination.whatsappClicks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="Belum ada event. Kunjungi detail trip, pilih titik keberangkatan, atau klik WhatsApp untuk mulai memantau." />
          )}
        </section>

        <section className="rounded-[1.35rem] border border-ink/10 bg-primary-soft p-5 sm:p-6">
          <h3 className="font-serif text-2xl tracking-[-0.035em] text-ink">
            Titik keberangkatan
          </h3>
          {summary.departures.length ? (
            <ol className="mt-5 space-y-3">
              {summary.departures.slice(0, 8).map((departure) => (
                <li
                  key={`${departure.destinationName}-${departure.departureLabel}`}
                  className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3 last:border-0"
                >
                  <span>
                    <span className="block font-semibold text-ink">
                      {departure.departureLabel}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {departure.destinationName}
                    </span>
                  </span>
                  <span className="text-right text-xs font-semibold tabular-nums text-ink-muted">
                    {number.format(departure.selections)} pilih
                    <br />
                    {number.format(departure.whatsappClicks)} WA
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState text="Belum ada pilihan titik keberangkatan tercatat." />
          )}
        </section>
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-5 text-sm leading-6 text-ink-muted">{text}</p>;
}
