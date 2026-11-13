import { z } from "zod";
import type { ListTrip } from "@/types/list-trip";

const slug = z.string().trim().min(2).max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug gunakan huruf kecil, angka, dan tanda hubung.");
const image = z.object({
  src: z.string().trim().max(2048),
  alt: z.string().trim().min(3).max(300),
  sortOrder: z.number().int().positive(),
});
const route = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500),
  active: z.boolean(),
});
export const listTripSchema = z.object({
  id: z.string().trim().min(1).max(120),
  slug,
  name: z.string().trim().min(2).max(160),
  category: z.string().min(1).max(80),
  categories: z.array(z.string().min(1).max(80)).min(1),
  routes: z.array(route).default([]),
  location: z.string().trim().max(160).default(""),
  duration: z.string().trim().max(120).default(""),
  description: z.string().trim().max(12000).default(""),
  coverImage: image,
  gallery: z.array(image).max(24).default([]),
  publicationStatus: z.enum(["draft", "published", "archived"]),
  updatedAt: z.string().min(1),
}).superRefine((trip, ctx) => {
  if (new Set(trip.routes.map((r) => r.id)).size !== trip.routes.length)
    ctx.addIssue({code:"custom",path:["routes"],message:"ID jalur tidak boleh duplikat."});
  if (trip.publicationStatus === "published" && !trip.coverImage.src.trim())
    ctx.addIssue({code:"custom",path:["coverImage","src"],message:"Upload cover sebelum Publish."});
});
export function parseListTrip(input: unknown): ListTrip {
  return listTripSchema.parse(input) as ListTrip;
}
export function newListTrip(now = new Date()): ListTrip {
  const id = `list-${crypto.randomUUID()}`;
  return {
    id, slug: `trip-baru-${now.getTime()}`,
    name:"Trip Baru", category:"mountain",categories:["mountain"],
    routes:[],location:"",duration:"",description:"",
    coverImage:{src:"",alt:"Gambar perjalanan",sortOrder:1},
    gallery:[],publicationStatus:"draft",updatedAt:now.toISOString(),
  };
}
