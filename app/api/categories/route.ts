import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getCategories(storeDbFromReq(req)));
}

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  try {
    const max = (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM categories").get() as { m: number }).m;
    const info = db.prepare("INSERT INTO categories (name, position) VALUES (?, ?)").run(name, max + 1);
    return NextResponse.json({ id: Number(info.lastInsertRowid), name, position: max + 1 }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
