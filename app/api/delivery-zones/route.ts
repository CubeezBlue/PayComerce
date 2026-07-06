import { NextRequest, NextResponse } from "next/server";
import { getDeliveryZones } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getDeliveryZones(false, storeDbFromReq(req)));
}

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre de la zona es obligatorio" }, { status: 400 });
  const max = (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM delivery_zones").get() as { m: number }).m;
  const info = db
    .prepare("INSERT INTO delivery_zones (name, cost, min_order, active, position) VALUES (?, ?, ?, ?, ?)")
    .run(name, Number(b.cost) || 0, Number(b.min_order) || 0, b.active === false || b.active === 0 ? 0 : 1, max + 1);
  return NextResponse.json({ id: Number(info.lastInsertRowid) }, { status: 201 });
}
