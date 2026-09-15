import { NextResponse } from "next/server";
import { requireAdmin } from "@/services/auth";
import { getCatalogRepository } from "@/services/catalog-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await context.params;
  const repository = await getCatalogRepository();
  return NextResponse.json({ audit: await repository.listAudit(id) });
}
