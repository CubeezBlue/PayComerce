import { NextRequest, NextResponse } from "next/server";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("envios");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const { id } = await params;
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre de la zona es obligatorio" }, { status: 400 });
  const info = db
    .prepare("UPDATE delivery_zones SET name = ?, cost = ?, min_order = ?, active = ? WHERE id = ?")
    .run(name, Number(b.cost) || 0, Number(b.min_order) || 0, b.active === false || b.active === 0 ? 0 : 1, Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const db = storeDbFromReq(req);
  const { id } = await params;
  const info = db.prepare("DELETE FROM delivery_zones WHERE id = ?").run(Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
