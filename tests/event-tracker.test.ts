import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCatalogSessionId, trackCatalogEvent } from "@/components/catalog/event-tracker";

const uuid = "11111111-1111-4111-8111-111111111111";
const fetchMock = vi.fn(async (..._args: unknown[]) => ({ ok: true }));

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => uuid });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("E-GOTO analytics event delivery", () => {
  it("sends a destination modal view with a stable anonymous session", () => {
    const items = new Map<string,string>();
    vi.stubGlobal("localStorage", {
      getItem: (key:string) => items.get(key) ?? null,
      setItem: (key:string,value:string) => { items.set(key,value); },
    });
    trackCatalogEvent("destination_view","gunung-rinjani");
    trackCatalogEvent("whatsapp_cta_clicked","gunung-rinjani");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first=JSON.parse((fetchMock.mock.calls[0][1] as {body:string}).body);
    const second=JSON.parse((fetchMock.mock.calls[1][1] as {body:string}).body);
    expect(first).toMatchObject({eventType:"destination_view",destinationSlug:"gunung-rinjani",sessionId:uuid});
    expect(second).toMatchObject({eventType:"whatsapp_cta_clicked",destinationSlug:"gunung-rinjani",sessionId:uuid});
  });
  it("does not crash or block the WhatsApp click when browser storage is disabled", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("SecurityError"); },
      setItem: () => { throw new Error("SecurityError"); },
    });
    expect(() => getCatalogSessionId()).not.toThrow();
    expect(() => trackCatalogEvent("whatsapp_cta_clicked","gunung-rinjani")).not.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
