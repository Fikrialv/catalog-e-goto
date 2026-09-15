import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";
import { parseDestinationPayload } from "@/lib/validation";

export async function GET() {
  await requireAdmin();
  const repository = await getCatalogRepository();
  return NextResponse.json({ records: await repository.listAdmin() });
}

export async function POST(request: Request) {
  const user = await requireAdmin(["ADMIN", "EDITOR"]);
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    payload?: unknown;
  } | null;
  if (body?.action !== "create" || !body.payload)
    return NextResponse.json(
      { error: "Payload create tidak valid." },
      { status: 400 },
    );
  try {
    const repository = await getCatalogRepository();
    const record = await repository.createDraft(
      parseDestinationPayload(body.payload),
      user.id,
    );
    revalidatePath("/catalog", "page");
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create gagal." },
      { status: 400 },
    );
  }
}
