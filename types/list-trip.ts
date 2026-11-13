import type { DestinationImage, TripRoute, PublicationStatus } from "@/types/catalog";

export type ListTrip = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categories: string[];
  routes: TripRoute[];
  location: string;
  duration: string;
  description: string;
  coverImage: DestinationImage;
  gallery: DestinationImage[];
  publicationStatus: PublicationStatus;
  updatedAt: string;
};
export type ListTripRecord = {
  id: string;
  slug: string;
  status: PublicationStatus;
  draft: ListTrip;
  published: ListTrip | null;
  draftVersion: number;
  publishedVersion: number;
  updatedAt: string;
};
