import { redirect } from "next/navigation";
import type { AdminRole } from "@/types/catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string;
  role: AdminRole;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user?.email) return null;
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  const role = profile?.role as AdminRole | undefined;
  if (!role) return null;
  return { id: user.id, email: user.email, role };
}

export async function requireAdmin(
  allowed: AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"],
) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!allowed.includes(user.role)) redirect("/admin/catalog?error=forbidden");
  return user;
}
