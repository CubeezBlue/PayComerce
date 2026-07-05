import { NextRequest, NextResponse } from "next/server";
import { getBranches } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getBranches(false, storeDbFromReq(req)));
}

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const max = (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM branches").get() as { m: number }).m;
  const info = db
    .prepare("INSERT INTO branches (name, address, whatsapp_number, active, position) VALUES (?, ?, ?, ?, ?)")
    .run(name, String(b.address ?? ""), String(b.whatsapp_number ?? ""), b.active === false || b.active === 0 ? 0 : 1, max + 1);
  return NextResponse.json({ id: Number(info.lastInsertRowid) }, { status: 201 });
}
