export type Category = "mountain" | "beach_waterfall";
export type CatalogMonth = { key: string; label: string };
export type PublicationStatus = "draft" | "published" | "archived";
export type AvailabilityStatus = "available" | "full" | "closed" | "cancelled";
export type AdminRole = "ADMIN" | "EDITOR" | "VIEWER";
export type AuditAction =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "SAVE_DRAFT"
  | "PUBLISH"
  | "UNPUBLISH"
  | "ARCHIVE"
  | "RESTORE"
  | "DUPLICATE";

export type PriceOption = {
  id: string;
  label: string;
  amount: number;
  sortOrder: number;
};

export type ItineraryItem = {
  time: string;
  activity: string;
  sortOrder: number;
};

export type ItineraryDay = {
  dayNumber: number;
  title: string;
  sortOrder: number;
  items: ItineraryItem[];
};

export type HighlightOffer = {
  id: string;
  enabled: boolean;
  label: string;
  /** The monthly departure this promotion belongs to. */
  scheduleId: string;
  priceId: string;
  /** Final customer price in rounded IDR. */
  discountAmount: number;
  discountType?: "fixed" | "percentage";
  discountValue?: number;
};

export type DepartureSchedule = {
  id: string;
  destinationId?: string;
  startDate: string;
  endDate: string | null;
  publicationStatus: PublicationStatus;
  availabilityStatus: AvailabilityStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type DestinationImage = {
  src: string;
  alt: string;
  sortOrder: number;
};

export type TripDestination = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  duration: string;
  description: string;
  coverImage: DestinationImage;
  gallery: DestinationImage[];
  prices: PriceOption[];
  schedules: DepartureSchedule[];
  includes: string[];
  excludes: string[];
  notes: string[];
  itinerary: ItineraryDay[];
  /** Multiple discounts may be selected from this destination's monthly departures. */
  highlights: HighlightOffer[];
  publicationStatus: PublicationStatus;
  updatedAt: string;
  publishedAt?: string | null;
  publishedVersion?: number;
};

export type CatalogRecord = {
  id: string;
  slug: string;
  status: PublicationStatus;
  draft: TripDestination;
  published: TripDestination | null;
  draftVersion: number;
  publishedVersion: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  action: AuditAction;
  beforeData: unknown;
  afterData: unknown;
  userId: string | null;
  entityType: "destination" | "schedule" | "price";
  entityId: string;
  publishedVersion: number | null;
  createdAt: string;
};
