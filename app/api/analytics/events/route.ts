import { NextResponse } from "next/server";
import { z } from "zod";
import { getDestinationBySlug } from "@/services/catalog";
import { recordCatalogEvent } from "@/services/monitoring";

const eventSchema = z.object({
  eventType: z.enum([
    "destination_view",
    "departure_selected",
    "whatsapp_cta_clicked",
  ]),
  destinationSlug: z.string().min(2).max(120),
  departureId: z.string().min(1).max(160).nullable().optional(),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const result = eventSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ ok: false }, { status: 400 });

  const destination = await getDestinationBySlug(result.data.destinationSlug);
  if (!destination) return NextResponse.json({ ok: false }, { status: 404 });

  const departure = result.data.departureId
    ? destination.prices.find((price) => price.id === result.data.departureId)
    : undefined;
  if (result.data.departureId && !departure) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordCatalogEvent({
    eventType: result.data.eventType,
    destinationId: destination.id,
    destinationSlug: destination.slug,
    destinationName: destination.name,
    departureId: departure?.id ?? null,
    departureLabel: departure?.label ?? null,
    sessionId: result.data.sessionId,
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
