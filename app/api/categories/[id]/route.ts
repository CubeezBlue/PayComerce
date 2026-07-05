import { NextRequest, NextResponse } from "next/server";
import { storeDbFromReq } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const db = storeDbFromReq(req);
  const { id } = await params;
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const info = db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const db = storeDbFromReq(req);
  const { id } = await params;
  const info = db.prepare("DELETE FROM categories WHERE id = ?").run(Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
