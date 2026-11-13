"use client";

import type { CatalogEventType } from "@/types/monitoring";

const sessionStorageKey = "egoto-catalog-session";
let volatileSessionId: string | null = null;

export function getCatalogSessionId() {
  if (volatileSessionId) return volatileSessionId;
  try {
    const saved = localStorage.getItem(sessionStorageKey);
    if (saved && /^[a-f0-9-]{36}$/i.test(saved)) {
      volatileSessionId = saved;
      return saved;
    }
  } catch {
    // Local storage can be disabled by browser privacy settings.
  }
  const next = crypto.randomUUID();
  volatileSessionId = next;
  try {
    localStorage.setItem(sessionStorageKey, next);
  } catch {
    // Analytics must never block viewing a trip or starting a WhatsApp chat.
  }
  return next;
}

export function trackCatalogEvent(
  eventType: CatalogEventType,
  destinationSlug: string,
  departureId?: string,
) {
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      destinationSlug,
      departureId: departureId ?? null,
      sessionId: getCatalogSessionId(),
    }),
    keepalive: true,
  }).catch(() => undefined);
}
