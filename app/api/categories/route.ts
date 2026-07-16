import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

export function GET(req: NextRequest) {
  return NextResponse.json(getCategories(storeDbFromReq(req)));
}

export async function POST(req: NextRequest) {
  const gErr = await guardPerm("productos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const emoji = String(body.emoji ?? "").trim().slice(0, 8);
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  try {
    const max = (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM categories").get() as { m: number }).m;
    const info = db.prepare("INSERT INTO categories (name, emoji, position) VALUES (?, ?, ?)").run(name, emoji, max + 1);
    return NextResponse.json({ id: Number(info.lastInsertRowid), name, emoji, position: max + 1 }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
