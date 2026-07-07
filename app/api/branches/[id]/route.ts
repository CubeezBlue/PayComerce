import { NextRequest, NextResponse } from "next/server";
import { storeDbFromReq } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const db = storeDbFromReq(req);
  const { id } = await params;
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const lat = b.lat != null && b.lat !== "" ? Number(b.lat) : null;
  const lon = b.lon != null && b.lon !== "" ? Number(b.lon) : null;
  const info = db
    .prepare("UPDATE branches SET name = ?, address = ?, whatsapp_number = ?, active = ?, lat = ?, lon = ? WHERE id = ?")
    .run(name, String(b.address ?? ""), String(b.whatsapp_number ?? ""), b.active === false || b.active === 0 ? 0 : 1, lat, lon, Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const db = storeDbFromReq(req);
  const { id } = await params;
  const total = (db.prepare("SELECT COUNT(*) AS c FROM branches").get() as { c: number }).c;
  if (total <= 1) return NextResponse.json({ error: "No podés borrar la única sucursal" }, { status: 400 });
  const info = db.prepare("DELETE FROM branches WHERE id = ?").run(Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
