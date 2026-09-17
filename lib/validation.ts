import { z } from "zod";
import type { TripDestination } from "@/types/catalog";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Gunakan tanggal YYYY-MM-DD.");
const slug = z
  .string()
  .trim()
  .min(2, "Slug wajib diisi.")
  .max(120, "Slug terlalu panjang.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.",
  );

const image = z.object({
  src: z.string().trim().min(1, "Source gambar wajib diisi."),
  alt: z.string().trim().min(3, "Alt text wajib diisi."),
  sortOrder: z.number().int().positive(),
});

const price = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(1),
  amount: z.number().int().positive("Harga harus lebih besar dari 0."),
  sortOrder: z.number().int().positive(),
});

const schedule = z.object({
  id: z.string().min(1),
  destinationId: z.string().optional(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  publicationStatus: z.enum(["draft", "published", "archived"]),
  availabilityStatus: z.enum(["available", "full", "closed", "cancelled"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const itineraryItem = z.object({
  time: z.string().trim().min(1),
  activity: z.string().trim().min(1),
  sortOrder: z.number().int().positive(),
});

const itineraryDay = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  sortOrder: z.number().int().positive(),
  items: z.array(itineraryItem),
});

const highlight = z.object({
  id: z.string().min(1).optional(),
  enabled: z.boolean(),
  label: z.string().trim().min(1, "Label highlight wajib diisi."),
  scheduleId: z.string().min(1),
  priceId: z.string().min(1, "Harga normal highlight wajib dipilih."),
  discountAmount: z
    .number()
    .int()
    .positive("Harga discount harus lebih besar dari 0."),
  discountType: z.enum(["fixed", "percentage"]).optional(),
  discountValue: z
    .number()
    .int()
    .min(5_000, "Potongan highlight minimal Rp5.000.")
    .max(200_000, "Potongan highlight maksimal Rp200.000.")
    .refine((value) => value % 5_000 === 0, {
      message: "Potongan highlight harus kelipatan Rp5.000.",
    })
    .optional(),
});

export const destinationPayloadSchema = z
  .object({
    id: z.string().min(1),
    slug,
    name: z.string().trim().min(2),
    category: z.enum(["mountain", "beach_waterfall"]),
    duration: z.string().trim().min(1),
    description: z.string().trim(),
    coverImage: image,
    gallery: z.array(image),
    prices: z.array(price).min(1, "Minimal satu price option."),
    schedules: z.array(schedule),
    includes: z.array(z.string().trim().min(1)),
    excludes: z.array(z.string().trim().min(1)),
    notes: z.array(z.string().trim().min(1)),
    itinerary: z.array(itineraryDay),
    highlights: z.array(highlight).default([]),
    publicationStatus: z.enum(["draft", "published", "archived"]),
    updatedAt: z.string().min(1),
    publishedAt: z.string().nullable().optional(),
    publishedVersion: z.number().int().nonnegative().optional(),
  })
  .superRefine((value, context) => {
    const keys = new Set<string>();
    for (const item of value.schedules) {
      if (item.endDate && item.endDate < item.startDate) {
        context.addIssue({
          code: "custom",
          path: ["schedules"],
          message: "End date tidak boleh sebelum start date.",
        });
      }
      if (
        item.endDate &&
        item.endDate.slice(0, 7) !== item.startDate.slice(0, 7)
      ) {
        context.addIssue({
          code: "custom",
          path: ["schedules"],
          message: "Jadwal katalog wajib berada dalam satu bulan.",
        });
      }
      const key = `${item.startDate}:${item.endDate ?? ""}`;
      if (keys.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["schedules"],
          message: "Schedule duplicate pada destination ini.",
        });
      }
      keys.add(key);
    }
    value.highlights.forEach((offer, index) => {
      if (!offer.enabled) return;
      const normalPrice = value.prices.find(
        (price) => price.id === offer.priceId,
      );
      const path = ["highlights", index];
      if (
        offer.discountType !== "fixed" ||
        !offer.discountValue ||
        offer.discountValue < 5_000 ||
        offer.discountValue > 200_000 ||
        offer.discountValue % 5_000 !== 0
      ) {
        context.addIssue({
          code: "custom",
          path: [...path, "discountValue"],
          message:
            "Potongan highlight harus Rp5.000–Rp200.000 dan kelipatan Rp5.000.",
        });
      }
      if (!normalPrice) {
        context.addIssue({
          code: "custom",
          path: [...path, "priceId"],
          message: "Harga normal highlight harus berasal dari price option.",
        });
      } else if (offer.discountAmount >= normalPrice.amount) {
        context.addIssue({
          code: "custom",
          path: [...path, "discountAmount"],
          message: "Harga discount harus lebih rendah dari harga normal.",
        });
      }
      if (
        offer.scheduleId &&
        !value.schedules.some((schedule) => schedule.id === offer.scheduleId)
      ) {
        context.addIssue({
          code: "custom",
          path: [...path, "scheduleId"],
          message: "Jadwal highlight tidak ditemukan.",
        });
      }
    });
  });

export function parseDestinationPayload(value: unknown): TripDestination {
  return destinationPayloadSchema.parse(
    migrateLegacyHighlight(value),
  ) as TripDestination;
}

function migrateLegacyHighlight(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const payload = { ...(value as Record<string, unknown>) };
  const schedules = Array.isArray(payload.schedules) ? payload.schedules : [];
  const legacy = payload.highlight;
  const current = Array.isArray(payload.highlights) ? payload.highlights : [];
  const offers = current.length
    ? current
    : legacy && typeof legacy === "object" && !Array.isArray(legacy)
      ? [legacy]
      : [];

  payload.highlights = offers.map((offer, index) => {
    const source = offer as Record<string, unknown>;
    const matchedSchedule = schedules.find(
      (schedule) =>
        schedule &&
        typeof schedule === "object" &&
        (schedule as Record<string, unknown>).startDate === source.date,
    ) as Record<string, unknown> | undefined;
    const scheduleId =
      typeof source.scheduleId === "string"
        ? source.scheduleId
        : (matchedSchedule?.id as string | undefined);
    const normalized = { ...source };
    delete normalized.date;
    delete normalized.itinerary;
    delete normalized.sortOrder;
    return {
      ...normalized,
      id:
        typeof normalized.id === "string" && normalized.id
          ? normalized.id
          : `${String(payload.id ?? "destination")}-highlight-${index + 1}`,
      scheduleId,
    };
  });
  delete payload.highlight;
  delete payload.sortOrder;
  return payload;
}

export function validateSlug(value: string) {
  return slug.safeParse(value).success;
}
