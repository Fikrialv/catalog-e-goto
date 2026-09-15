import { describe, expect, it } from "vitest";
import {
  isSafeStorageDestinationId,
  isStoragePathOwnedByDestination,
  isSupportedCatalogImageType,
  storagePathFromPublicUrl,
} from "@/lib/storage";

describe("catalog image storage safety", () => {
  it("allows supported raster and modern image formats only", () => {
    expect(isSupportedCatalogImageType("image/jpeg")).toBe(true);
    expect(isSupportedCatalogImageType("image/webp")).toBe(true);
    expect(isSupportedCatalogImageType("image/svg+xml")).toBe(false);
    expect(isSupportedCatalogImageType("application/pdf")).toBe(false);
  });

  it("accepts safe destination folders and rejects traversal-like values", () => {
    expect(isSafeStorageDestinationId("cmc-tumpak-sewu")).toBe(true);
    expect(isSafeStorageDestinationId("../other-destination")).toBe(false);
    expect(isSafeStorageDestinationId("destination/other")).toBe(false);
  });

  it("only resolves assets from the configured public bucket", () => {
    expect(
      storagePathFromPublicUrl(
        "https://project.supabase.co/storage/v1/object/public/catalog-images/cmc/photo.webp",
        "https://project.supabase.co",
        "catalog-images",
      ),
    ).toBe("cmc/photo.webp");
    expect(
      storagePathFromPublicUrl(
        "https://attacker.example/storage/v1/object/public/catalog-images/cmc/photo.webp",
        "https://project.supabase.co",
        "catalog-images",
      ),
    ).toBeNull();
  });

  it("prevents deleting assets outside the destination folder", () => {
    expect(isStoragePathOwnedByDestination("cmc/photo.webp", "cmc")).toBe(true);
    expect(isStoragePathOwnedByDestination("other/photo.webp", "cmc")).toBe(
      false,
    );
    expect(isStoragePathOwnedByDestination("cmc", "cmc")).toBe(false);
  });
});
