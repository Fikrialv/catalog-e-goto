import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isSupabaseConfigured,
  SUPABASE_ADMIN_EMAIL,
  SUPABASE_ADMIN_USERNAME,
} from "@/lib/config";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    identifier?: string;
    email?: string;
    password?: string;
  } | null;
  const identifier =
    (body?.identifier ?? body?.email)?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!identifier || !password)
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 },
    );

  if (!isSupabaseConfigured)
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi." },
      { status: 503 },
    );

  const supabase = await createSupabaseServerClient();
  if (!supabase)
    return NextResponse.json(
      { error: "Supabase client tidak tersedia." },
      { status: 503 },
    );
  const email = identifier.includes("@")
    ? identifier
    : identifier === SUPABASE_ADMIN_USERNAME
      ? SUPABASE_ADMIN_EMAIL
      : "";
  if (!email)
    return NextResponse.json(
      { error: "Username atau email Supabase tidak valid." },
      { status: 400 },
    );
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error)
    return NextResponse.json(
      { error: "Email atau password tidak valid." },
      { status: 401 },
    );
  return NextResponse.json({ ok: true, redirectTo: "/admin" });
}
