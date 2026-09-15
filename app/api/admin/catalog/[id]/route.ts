import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { parseDestinationPayload } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  const repository = await getCatalogRepository();
  const record = await repository.getAdmin(id);
  return record
    ? NextResponse.json({ record })
    : NextResponse.json(
        { error: "Destination tidak ditemukan." },
        { status: 404 },
      );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireAdmin(["ADMIN", "EDITOR"]);
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    payload?: unknown;
    confirmed?: boolean;
  } | null;
  if (!body?.action)
    return NextResponse.json({ error: "Action wajib diisi." }, { status: 400 });
  if (
    ["publish", "unpublish", "archive", "restore", "duplicate"].includes(
      body.action,
    ) &&
    body.confirmed !== true
  )
    return NextResponse.json(
      { error: "Konfirmasi eksplisit wajib." },
      { status: 400 },
    );
  try {
    const repository = await getCatalogRepository();
    let result;
    if (body.action === "save-draft") {
      if (!body.payload)
        return NextResponse.json(
          { error: "Payload draft wajib diisi." },
          { status: 400 },
        );
      result = await repository.saveDraft(
        id,
        parseDestinationPayload(body.payload),
        user.id,
      );
    } else if (body.action === "publish")
      result = await repository.publish(id, user.id);
    else if (body.action === "unpublish")
      result = await repository.unpublish(id, user.id);
    else if (body.action === "archive")
      result = await repository.archive(id, user.id);
    else if (body.action === "restore")
      result = await repository.restore(id, user.id);
    else if (body.action === "duplicate")
      result = await repository.duplicate(id, user.id);
    else
      return NextResponse.json(
        { error: "Action tidak dikenali." },
        { status: 400 },
      );
    revalidatePath("/", "page");
    revalidatePath("/catalog", "page");
    revalidatePath("/catalog/[slug]", "page");
    return NextResponse.json({
      record: result,
      message: `${body.action} berhasil.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Aksi gagal." },
      { status: 400 },
    );
  }
}
