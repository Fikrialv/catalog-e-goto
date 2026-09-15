import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/auth";
import { deleteCatalogImage, uploadCatalogImage } from "@/services/storage";
import { isSafeStorageDestinationId } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await requireAdmin(["ADMIN", "EDITOR"]);
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

export async function DELETE(request: Request) {
  await requireAdmin(["ADMIN", "EDITOR"]);
  const body = (await request.json().catch(() => null)) as {
    src?: string;
    destinationId?: string;
  } | null;
  if (!body?.src || !body.destinationId)
    return NextResponse.json(
      { error: "Source dan destination ID wajib diisi." },
      { status: 400 },
    );
  try {
    await deleteCatalogImage(body.src, body.destinationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Hapus gambar gagal." },
      { status: 400 },
    );
  }
}
