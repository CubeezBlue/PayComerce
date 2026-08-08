import type { NextRequest } from "next/server";

// Dominio público real para armar back_urls / links absolutos.
// Detrás del proxy de Hostinger, req.nextUrl.origin resuelve a la dirección
// interna del proceso (0.0.0.0:3000). Por eso preferimos, en orden:
//   1) APP_URL (env, ej: https://paycomerce.com)
//   2) el header Host reenviado por el proxy (x-forwarded-host / host) + proto
//   3) req.nextUrl.origin (último recurso, dev local)
export function publicOrigin(req: NextRequest): string {
  const env = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host && !host.startsWith("0.0.0.0") && !host.startsWith("127.0.0.1")) {
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}
