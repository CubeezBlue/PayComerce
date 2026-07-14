import { NextRequest, NextResponse } from "next/server";
import { listKitchenTickets, advanceKitchenTicket, getSettings } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

// Tablero de comandas de cocina.
export async function GET(req: NextRequest) {
  const err = await guardAddonPerm(req, "cocina", "cocina");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const prepDefault = Number(getSettings(db).kds_prep_minutes) || 15;
  return NextResponse.json({ tickets: listKitchenTickets(db), prepDefault });
}

// Avanzar el estado de una comanda (pendiente → preparando → listo → entregado).
export async function POST(req: NextRequest) {
  const err = await guardAddonPerm(req, "cocina", "cocina");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const b = await req.json();
  advanceKitchenTicket(Number(b.id), String(b.status ?? ""), storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}
