import { describe, expect, it } from "vitest";
import { clone, createChangeSummary } from "@/lib/catalog-utils";
import { getMonthlyDestinationsFromDestinations } from "@/services/catalog";
import {
  destinationPayloadSchema,
  parseDestinationPayload,
} from "@/lib/validation";
import { destinations } from "@/data/catalog";

describe("published snapshot workflow", () => {
  it("keeps published snapshot until publish, then moves schedule month", () => {
    const original = destinations.find((item) => item.id === "cmc-tumpak-sewu");
    expect(original).toBeDefined();
    if (!original) return;
    const published = clone(original);
    const draft = clone(original);
    draft.prices[0].amount = 850000;
    draft.schedules[0].startDate = "2026-12-02";
    draft.schedules[0].endDate = "2026-12-03";

    expect(published.prices[0].amount).toBe(original.prices[0].amount);
    expect(
      getMonthlyDestinationsFromDestinations([published], { monthKey: "2026-12" }).some(
        (item) => item.id === original.id,
      ),
    ).toBe(false);

    const nextPublished = { ...draft, publicationStatus: "published" as const };
    expect(nextPublished.prices[0].amount).toBe(850000);
    expect(
      getMonthlyDestinationsFromDestinations([nextPublished], { monthKey: "2026-12" }).some(
        (item) => item.id === original.id,
      ),
    ).toBe(true);
  });
});

describe("catalog safety helpers", () => {
  it("validates a separate admin-managed highlight discount", () => {
    const destination = clone(destinations[0]);
    const highlight = {
      id: "test-highlight",
      enabled: true,
      label: "Promo Oktober",
      scheduleId: destination.schedules[0].id,
      priceId: destination.prices[0].id,
      discountAmount: destination.prices[0].amount - 100000,
    };
    destination.highlights = [highlight];
    expect(
      destinationPayloadSchema.parse(destination).highlights?.[0]
        .discountAmount,
    ).toBe(highlight.discountAmount);

    expect(() =>
      destinationPayloadSchema.parse({
        ...destination,
        highlights: [
          {
            ...highlight,
            discountAmount: destination.prices[0].amount,
          },
        ],
      }),
    ).toThrow("Harga discount harus lebih rendah dari harga normal.");
  });

  it("migrates a legacy highlight into the schedule-linked highlight collection", () => {
    const destination = clone(destinations[0]);
    const legacyOffer = destination.highlights?.[0];
    if (!legacyOffer) throw new Error("Fixture highlight tidak ditemukan.");
    const legacyPayload = {
      ...destination,
      highlights: [],
      highlight: {
        enabled: true,
        label: legacyOffer.label,
        date: destination.schedules[0].startDate,
        priceId: legacyOffer.priceId,
        discountAmount: legacyOffer.discountAmount,
        itinerary: destination.itinerary,
      },
    };

    const normalized = parseDestinationPayload(legacyPayload);
    expect(normalized.highlights).toEqual([
      expect.objectContaining({ scheduleId: destination.schedules[0].id }),
    ]);
    expect(normalized.highlights?.[0]).not.toHaveProperty("date");
    expect(normalized.highlights?.[0]).not.toHaveProperty("itinerary");
  });

  it("rejects invalid schedule ranges and duplicate dates", () => {
    const invalid = {
      id: "safe-test",
      slug: "safe-test",
      name: "Safe test",
      category: "mountain",
      duration: "2 Hari",
      description: "",
      coverImage: { src: "/x.jpg", alt: "Test image", sortOrder: 1 },
      gallery: [],
      prices: [{ id: "price", label: "A", amount: 100, sortOrder: 1 }],
      schedules: [
        {
          id: "a",
          startDate: "2026-12-20",
          endDate: "2026-12-19",
          publicationStatus: "draft",
          availabilityStatus: "available",
        },
        {
          id: "b",
          startDate: "2026-12-20",
          endDate: "2026-12-20",
          publicationStatus: "draft",
          availabilityStatus: "available",
        },
      ],
      includes: [],
      excludes: [],
      notes: [],
      itinerary: [],
      publicationStatus: "draft",
      sortOrder: 1,
      updatedAt: new Date().toISOString(),
    };
    expect(() => destinationPayloadSchema.parse(invalid)).toThrow();
  });

  it("rejects a departure that crosses catalog months", () => {
    const destination = clone(destinations[3]);
    destination.schedules[0] = {
      ...destination.schedules[0],
      startDate: "2026-10-31",
      endDate: "2026-11-02",
    };

    expect(() => destinationPayloadSchema.parse(destination)).toThrow(
      "Jadwal katalog wajib berada dalam satu bulan.",
    );
  });

  it("returns human-readable changed fields", () => {
    const destination = destinations.find(
      (item) => item.slug === "cmc-pantai-3-warna-tumpak-sewu",
    );
    expect(destination).toBeDefined();
    if (!destination) return;
    const next = clone(destination);
    next.name = "CMC baru";
    expect(
      createChangeSummary(destination, next).map((item) => item.field),
    ).toEqual(["name"]);
  });
});
