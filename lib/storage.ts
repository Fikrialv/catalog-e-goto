export const MAX_CATALOG_IMAGE_BYTES = 5 * 1024 * 1024;

export const CATALOG_IMAGE_MIME_TYPES = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function isSupportedCatalogImageType(type: string) {
  return (CATALOG_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

export function isSafeStorageDestinationId(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(value);
}

export function storagePathFromPublicUrl(
  src: string,
  supabaseUrl: string,
  bucket: string,
) {
  try {
    const publicUrl = new URL(src);
    const baseUrl = new URL(supabaseUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;

    if (
      publicUrl.origin !== baseUrl.origin ||
      !publicUrl.pathname.startsWith(prefix)
    ) {
      return null;
    }

    return decodeURIComponent(publicUrl.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export function isStoragePathOwnedByDestination(
  path: string,
  destinationId: string,
) {
  return (
    isSafeStorageDestinationId(destinationId) &&
    path.startsWith(`${destinationId}/`) &&
    path.length > destinationId.length + 1
  );
}
