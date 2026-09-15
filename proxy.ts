import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/lib/config";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

function catalogNotFoundResponse() {
  return new NextResponse(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Trip tidak ditemukan | E-GOTO</title><style>body{margin:0;background:#f5f1e8;color:#193027;font-family:Arial,sans-serif}main{min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center}p{letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#a86e34;font-weight:700}h1{font-family:Georgia,serif;font-size:clamp(42px,8vw,76px);letter-spacing:-.06em;margin:16px 0}a{display:inline-flex;margin-top:20px;min-height:48px;align-items:center;padding:0 24px;border-radius:999px;background:#193027;color:#fff;text-decoration:none;font-weight:700}</style></head><body><main><div><p>404</p><h1>Trip tidak ditemukan.</h1><span>Coba kembali ke katalog untuk melihat destination yang tersedia.</span><br><a href="/catalog">Kembali ke katalog</a></div></main></body></html>`,
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

async function isPublishedCatalogSlug(slug: string) {
  const url = new URL("/rest/v1/catalog_documents", SUPABASE_URL);
  url.searchParams.set("select", "id");
  url.searchParams.set("slug", `eq.${slug}`);
  url.searchParams.set("publication_status", "eq.published");
  url.searchParams.set("published_payload", "not.is.null");
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    cache: "force-cache",
  });
  if (!response.ok) return true;
  const rows = (await response.json()) as { id: string }[];
  return rows.length > 0;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/catalog") return NextResponse.next();
  if (path.startsWith("/catalog/") && request.method === "GET") {
    const slug = decodeURIComponent(path.slice("/catalog/".length));
    if (!slug || slug.includes("/")) return catalogNotFoundResponse();
    return (await isPublishedCatalogSlug(slug))
      ? NextResponse.next()
      : catalogNotFoundResponse();
  }
  if (path === "/admin/login" || path.startsWith("/api/auth/"))
    return NextResponse.next();
  const { response, claims } = await updateSupabaseSession(request);
  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (!claims) return NextResponse.redirect(new URL("/admin/login", request.url));
  return response;
}

export const config = {
  matcher: ["/catalog/:path*", "/admin/:path*", "/api/admin/:path*"],
};
