import { describe, expect, it } from "vitest";
import { summarizeMonitoringEvents } from "@/lib/monitoring";

describe("monitoring summary", () => {
  it("groups destination and meeting-point intent without counting other events", () => {
    const summary = summarizeMonitoringEvents(
      [
        {
          id: "1",
          eventType: "destination_view",
          destinationId: "lawu",
          destinationSlug: "gunung-lawu",
          destinationName: "Gunung Lawu",
          departureId: null,
          departureLabel: null,
          sessionId: "session",
          createdAt: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "2",
          eventType: "departure_selected",
          destinationId: "lawu",
          destinationSlug: "gunung-lawu",
          destinationName: "Gunung Lawu",
          departureId: "lawu-jakarta",
          departureLabel: "Jakarta",
          sessionId: "session",
          createdAt: "2026-09-01T00:01:00.000Z",
        },
        {
          id: "3",
          eventType: "whatsapp_cta_clicked",
          destinationId: "lawu",
          destinationSlug: "gunung-lawu",
          destinationName: "Gunung Lawu",
          departureId: "lawu-jakarta",
          departureLabel: "Jakarta",
          sessionId: "session",
          createdAt: "2026-09-01T00:02:00.000Z",
        },
      ],
      "2026-08-02T00:00:00.000Z",
    );

    expect(summary).toMatchObject({
      views: 1,
      departuresSelected: 1,
      whatsappClicks: 1,
      destinations: [
        {
          destinationName: "Gunung Lawu",
          views: 1,
          departuresSelected: 1,
          whatsappClicks: 1,
        },
      ],
      departures: [
        { destinationName: "Gunung Lawu", departureLabel: "Jakarta" },
      ],
    });
  });
});
