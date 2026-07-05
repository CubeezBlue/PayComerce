import { NextRequest, NextResponse } from "next/server";

// Detecta a qué comercio pertenece la visita, según el subdominio.
//   kiosco.paycomerce.com  -> "kiosco"
//   kiosco.localhost:3000  -> "kiosco"   (para pruebas locales)
//   paycomerce.com / localhost -> ""     (sin comercio: demo/marketing)
// También acepta ?store=slug como override para probar sin subdominios.
function slugFromHost(hostname: string): string {
  const labels = hostname.split(".");
  if (hostname.endsWith("localhost")) {
    return labels.length > 1 ? labels[0] : "";
  }
  // dominio real: sub.dominio.tld -> 3+ labels
  return labels.length > 2 ? labels[0] : "";
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").split(":")[0];
  let slug = req.nextUrl.searchParams.get("store") || slugFromHost(host);
  if (slug === "www") slug = "";

  const headers = new Headers(req.headers);
  headers.set("x-store-slug", slug);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // No corre en assets estáticos
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
