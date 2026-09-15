export type CatalogEventType =
  | "destination_view"
  | "departure_selected"
  | "whatsapp_cta_clicked";

export type CatalogEvent = {
  id: string;
  eventType: CatalogEventType;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  departureId: string | null;
  departureLabel: string | null;
  sessionId: string;
  createdAt: string;
};

export type MonitoringDestination = {
  destinationId: string;
  destinationName: string;
  views: number;
  departuresSelected: number;
  whatsappClicks: number;
};

export type MonitoringDeparture = {
  destinationName: string;
  departureLabel: string;
  selections: number;
  whatsappClicks: number;
};

export type MonitoringSummary = {
  since: string;
  views: number;
  departuresSelected: number;
  whatsappClicks: number;
  destinations: MonitoringDestination[];
  departures: MonitoringDeparture[];
  recentEvents: CatalogEvent[];
};
