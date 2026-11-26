/** Unique, valid, length-limited Catalog IDs/slugs for repeated Duplicate actions. */
export function catalogDuplicateIdentity(slug: string, nonce: string) {
  const suffix = nonce.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  if (!suffix) throw new Error("Identitas duplikasi tidak valid.");
  const base = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 120 - suffix.length - 6).replace(/-+$/g, "");
  return {
    id: `destination-copy-${suffix}`,
    slug: `${base || "trip"}-copy-${suffix}`,
  };
}
