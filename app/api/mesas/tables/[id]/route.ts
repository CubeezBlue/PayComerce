import { NextRequest, NextResponse } from "next/server";
import { updateTable, deleteTable } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

// Mover una mesa en el mapa (pos_x/pos_y) puede hacerlo quien atiende (permiso mesas);
// renombrar / cambiar lugares / borrar / activar requiere configuración.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const b = await req.json();
  const onlyPosition = Object.keys(b).every((k) => k === "pos_x" || k === "pos_y");
  const err = await guardAddonPerm(req, "mesas", onlyPosition ? "mesas" : "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const fields: Parameters<typeof updateTable>[1] = {};
  if (b.name != null) fields.name = String(b.name).trim();
  if (b.seats != null) fields.seats = Number(b.seats);
  if (b.pos_x != null) fields.pos_x = Number(b.pos_x);
  if (b.pos_y != null) fields.pos_y = Number(b.pos_y);
  if (b.room_id !== undefined) fields.room_id = b.room_id != null ? Number(b.room_id) : null;
  if (b.active != null) fields.active = !!b.active;
  updateTable(Number((await params).id), fields, storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await guardAddonPerm(req, "mesas", "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  deleteTable(Number((await params).id), storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}
