import { NextRequest, NextResponse } from "next/server";

// Detecta a qué comercio pertenece la visita. Soporta:
//   1) Ruta  /t/<slug>/...        -> entra al comercio (fija cookie) y reescribe sin el prefijo
//   2) Cookie pc_store            -> mantiene el comercio en las páginas siguientes
//   3) ?store=slug                -> override para pruebas
//   4) Subdominio <slug>.dominio  -> para cuando se use un VPS con wildcard
// Vacío = sitio principal (landing de marketing).
function slugFromHost(hostname: string): string {
  const labels = hostname.split(".");
  if (hostname.endsWith("localhost")) return labels.length > 1 ? labels[0] : "";
  return labels.length > 2 ? labels[0] : "";
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const parts = url.pathname.split("/"); // ['', 't', 'slug', 'resto...']
  const headers = new Headers(req.headers);

  // 1) Entrada por /t/<slug>: fija el comercio (header + cookie) y sirve la ruta sin el prefijo
  if (parts[1] === "t" && parts[2]) {
    const slug = parts[2];
    headers.set("x-store-slug", slug);
    const rest = "/" + parts.slice(3).join("/");
    const res = NextResponse.rewrite(new URL((rest === "/" ? "/" : rest) + url.search, url), { request: { headers } });
    res.cookies.set("pc_store", slug, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // 2) La raíz del dominio SIEMPRE es la landing de marketing (vende PayComerce).
  //    Las tiendas viven en /t/<slug>. Ignora cookie a propósito.
  if (url.pathname === "/") {
    headers.set("x-store-slug", "");
    return NextResponse.rewrite(new URL("/precios", url), { request: { headers } });
  }

  // 3) Comercio desde ?store / cookie / subdominio (para las páginas siguientes)
  let slug = url.searchParams.get("store") || req.cookies.get("pc_store")?.value || slugFromHost((req.headers.get("host") || "").split(":")[0]);
  if (slug === "www") slug = "";
  headers.set("x-store-slug", slug);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
