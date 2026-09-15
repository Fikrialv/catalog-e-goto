import type {
  CatalogEvent,
  MonitoringDeparture,
  MonitoringDestination,
  MonitoringSummary,
} from "@/types/monitoring";

export function summarizeMonitoringEvents(
  events: CatalogEvent[],
  since: string,
): MonitoringSummary {
  const destinations = new Map<string, MonitoringDestination>();
  const departures = new Map<string, MonitoringDeparture>();
  let views = 0;
  let departuresSelected = 0;
  let whatsappClicks = 0;

  for (const event of events) {
    const destination = destinations.get(event.destinationId) ?? {
      destinationId: event.destinationId,
      destinationName: event.destinationName,
      views: 0,
      departuresSelected: 0,
      whatsappClicks: 0,
    };
    if (event.eventType === "destination_view") {
      views += 1;
      destination.views += 1;
    }
    if (event.eventType === "departure_selected") {
      departuresSelected += 1;
      destination.departuresSelected += 1;
    }
    if (event.eventType === "whatsapp_cta_clicked") {
      whatsappClicks += 1;
      destination.whatsappClicks += 1;
    }
    destinations.set(event.destinationId, destination);

    if (event.departureLabel) {
      const key = `${event.destinationId}:${event.departureId ?? event.departureLabel}`;
      const departure = departures.get(key) ?? {
        destinationName: event.destinationName,
        departureLabel: event.departureLabel,
        selections: 0,
        whatsappClicks: 0,
      };
      if (event.eventType === "departure_selected") departure.selections += 1;
      if (event.eventType === "whatsapp_cta_clicked") departure.whatsappClicks += 1;
      departures.set(key, departure);
    }
  }

  return {
    since,
    views,
    departuresSelected,
    whatsappClicks,
    destinations: [...destinations.values()].sort(
      (left, right) =>
        right.whatsappClicks - left.whatsappClicks || right.views - left.views,
    ),
    departures: [...departures.values()].sort(
      (left, right) =>
        right.whatsappClicks - left.whatsappClicks ||
        right.selections - left.selections,
    ),
    recentEvents: [...events]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 10),
  };
}
