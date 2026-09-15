import { formatScheduleCompact } from "@/lib/format";
import type { DepartureSchedule } from "@/types/catalog";

export function ScheduleChips({
  schedules,
}: {
  schedules: DepartureSchedule[];
}) {
  if (!schedules.length) {
    return (
      <span className="text-xs text-ink-muted">Jadwal belum tersedia</span>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="list"
      aria-label="Tanggal keberangkatan tersedia"
    >
      {schedules.map((schedule) => (
        <span
          key={schedule.id}
          role="listitem"
          className="rounded-full border border-ink/12 bg-white/70 px-3 py-1.5 text-xs font-semibold tabular-nums text-ink transition-colors duration-200"
        >
          {formatScheduleCompact(schedule)}
        </span>
      ))}
    </div>
  );
}
