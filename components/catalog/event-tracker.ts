"use client";

import type { CatalogEventType } from "@/types/monitoring";

const sessionStorageKey = "egoto-catalog-session";

export function getCatalogSessionId() {
  const saved = localStorage.getItem(sessionStorageKey);
  if (saved) return saved;
  const next = crypto.randomUUID();
  localStorage.setItem(sessionStorageKey, next);
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
