import { NextResponse } from "next/server";

// Marca de versión para verificar qué build está sirviendo el servidor.
// Si /api/version devuelve este "build", el código nuevo está vivo.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    build: "2026-08-05-BUILD-CHECK-1",
    tiene: ["mesas", "cocina", "caja", "equipos", "suscripcion-mensual-anual", "owner-mp-test", "backups"],
    ts: new Date().toISOString(),
  });
}
