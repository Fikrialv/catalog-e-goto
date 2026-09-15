import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, SUPABASE_URL } from "@/lib/config";
import {
  isSafeStorageDestinationId,
  isStoragePathOwnedByDestination,
  isSupportedCatalogImageType,
  MAX_CATALOG_IMAGE_BYTES,
  storagePathFromPublicUrl,
} from "@/lib/storage";

export async function uploadCatalogImage(file: File, destinationId: string) {
  if (!isSupabaseConfigured)
    throw new Error("Image upload membutuhkan konfigurasi Supabase Storage.");
  if (!isSafeStorageDestinationId(destinationId))
    throw new Error("Destination ID tidak valid.");
  if (!isSupportedCatalogImageType(file.type))
    throw new Error("Gunakan gambar JPEG, PNG, WebP, atau AVIF.");
  if (file.size > MAX_CATALOG_IMAGE_BYTES)
    throw new Error("Ukuran gambar maksimal 5 MB.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${destinationId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "catalog-images")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;
  const { data } = supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "catalog-images")
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteCatalogImage(src: string, destinationId: string) {
  if (!isSupabaseConfigured)
    throw new Error("Image delete membutuhkan konfigurasi Supabase Storage.");
  if (!isSafeStorageDestinationId(destinationId))
    throw new Error("Destination ID tidak valid.");

  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "catalog-images";
  const path = storagePathFromPublicUrl(src, SUPABASE_URL, bucket);
  if (!path || !isStoragePathOwnedByDestination(path, destinationId))
    throw new Error("Asset gambar tidak berada di folder destination ini.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase client tidak tersedia.");
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
