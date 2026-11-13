import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/api-auth";
import { uploadCatalogImage } from "@/services/storage";
import { isSafeStorageDestinationId } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await authorizeAdminApi(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  const formData = await request.formData();
  const file = formData.get("file");
  const destinationId = String(formData.get("destinationId") ?? "");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "File gambar wajib diisi." },
      { status: 400 },
    );
  if (!isSafeStorageDestinationId(destinationId))
    return NextResponse.json(
      { error: "Destination ID tidak valid." },
      { status: 400 },
    );
  try {
    const src = await uploadCatalogImage(file, destinationId);
    return NextResponse.json({ src, userId: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal." },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const auth = await authorizeAdminApi(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json(
    { error: "Penghapusan langsung gambar dinonaktifkan agar snapshot Published tetap aman." },
    { status: 409 },
  );
}
