import { NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/api-auth";
import { getCatalogRepository } from "@/services/catalog-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeAdminApi();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const repository = await getCatalogRepository();
  return NextResponse.json({ audit: await repository.listAudit(id) });
}
