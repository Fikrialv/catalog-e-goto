/** Guard against silently overwriting a newer Catalog draft from another admin tab. */
export const CATALOG_CONFLICT_MESSAGE =
  "Draft telah diperbarui dari sesi lain. Salin perubahan Anda, muat ulang halaman, lalu ulangi edit.";

export function assertCatalogDraftVersion(actual: number, expected: number | undefined): void {
  if (!Number.isSafeInteger(expected) || expected !== actual) {
    throw new Error(CATALOG_CONFLICT_MESSAGE);
  }
}
