import { NextRequest, NextResponse } from "next/server";
import { createRoom } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

// Crear sala (configuración del salón → requiere permiso config).
export async function POST(req: NextRequest) {
  const err = await guardAddonPerm(req, "mesas", "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const b = await req.json();
  const id = createRoom(String(b.name ?? "").trim() || "Salón", storeDbFromReq(req));
  return NextResponse.json({ id }, { status: 201 });
}
