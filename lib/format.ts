import type { DepartureSchedule, Category } from "@/types/catalog";

const idDate = (value: string) => new Date(`${value}T00:00:00Z`);

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(idDate(`${monthKey}-01`));
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(idDate(date));
}

export function formatScheduleLabel(schedule: DepartureSchedule) {
  const start = idDate(schedule.startDate);
  const end = schedule.endDate ? idDate(schedule.endDate) : null;
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (!end) return formatter.format(start);
  if (
    start.getUTCMonth() === end.getUTCMonth() &&
    start.getUTCFullYear() === end.getUTCFullYear()
  ) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(start)}`;
  }
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

export function formatScheduleCompact(schedule: DepartureSchedule) {
  const start = idDate(schedule.startDate);
  const end = schedule.endDate ? idDate(schedule.endDate) : null;
  return end
    ? `${start.getUTCDate()}–${end.getUTCDate()}`
    : `${start.getUTCDate()}`;
}

export function categoryLabel(category: Category) {
  return category === "mountain" ? "Mountain" : "Beach & Waterfall";
}
