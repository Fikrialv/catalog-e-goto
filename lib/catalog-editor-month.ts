import type { DepartureSchedule } from "@/types/catalog";

/** Keep the requested catalog month visible when an admin opens a trip editor. */
export function getInitialCatalogEditorMonth(
  requestedMonth: string | undefined,
  schedules: DepartureSchedule[],
  fallbackMonth: string,
): string {
  if (requestedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    return requestedMonth;
  }
  const scheduledMonth = schedules.find((schedule) =>
    /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(schedule.startDate),
  )?.startDate.slice(0, 7);
  return scheduledMonth ?? fallbackMonth;
}
