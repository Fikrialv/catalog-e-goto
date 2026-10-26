import { NextResponse } from "next/server";
import { getCurrentUser, type AuthUser } from "@/services/auth";
import type { AdminRole } from "@/types/catalog";

export type AdminApiAuthorization =
  | { ok: true; user: AuthUser; response?: never }
  | { ok: false; user?: never; response: NextResponse };

export function getAdminApiStatus(
  role: AdminRole | null,
  allowed: readonly AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"],
): 200 | 401 | 403 {
  if (!role) return 401;
  return allowed.includes(role) ? 200 : 403;
}

/** Unlike page guards, API guards must return JSON, never a login HTML redirect. */
export async function authorizeAdminApi(
  allowed: readonly AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"],
): Promise<AdminApiAuthorization> {
  const user = await getCurrentUser();
  const status = getAdminApiStatus(user?.role ?? null, allowed);
  if (status === 401) {
    return { ok: false, response: NextResponse.json(
      { error: "Sesi admin berakhir. Silakan login ulang." }, { status: 401 },
    ) };
  }
  if (status === 403) {
    return { ok: false, response: NextResponse.json(
      { error: "Akun tidak memiliki izin untuk operasi ini." }, { status: 403 },
    ) };
  }
  return { ok: true, user: user! };
}
