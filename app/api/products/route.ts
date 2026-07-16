import { NextRequest, NextResponse } from "next/server";
import { getProductsWithBranches, getBranches, setProductBranches, BranchStock, getSettings } from "@/lib/db";
import { productLimit } from "@/lib/plans";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

export function GET(req: NextRequest) {
  return NextResponse.json(getProductsWithBranches(false, storeDbFromReq(req)));
}

function parseBranches(raw: unknown): BranchStock[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((x) => x && Number.isFinite(Number(x.branch_id)))
    .map((x) => ({
      branch_id: Number(x.branch_id),
      stock: x.stock === null || x.stock === undefined || x.stock === "" ? null : Number(x.stock),
    }));
}

export async function POST(req: NextRequest) {
  const gErr = await guardPerm("productos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const price = Number(b.price);
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });

  // Límite de productos según el plan
  const limit = productLimit(getSettings(db));
  if (limit !== null) {
    const count = (db.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }).c;
    if (count >= limit)
      return NextResponse.json({ error: `Tu plan permite hasta ${limit} productos. Mejorá tu plan para agregar más.` }, { status: 403 });
  }

  const max = (db.prepare("SELECT COALESCE(MAX(position), -1) AS m FROM products").get() as { m: number }).m;
  const stock = b.stock === null || b.stock === undefined || b.stock === "" ? null : Number(b.stock);
  const info = db
    .prepare(
      `INSERT INTO products (category_id, name, description, price, image_url, stock, active, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      b.category_id ?? null,
      name,
      String(b.description ?? ""),
      price,
      String(b.image_url ?? ""),
      stock,
      b.active === false || b.active === 0 ? 0 : 1,
      max + 1
    );
  const id = Number(info.lastInsertRowid);

  // Sucursales: si vienen especificadas se respetan; si no, disponible en todas.
  const branches = parseBranches(b.branches) ?? getBranches(false, db).map((br) => ({ branch_id: br.id, stock }));
  setProductBranches(id, branches, db);

  return NextResponse.json({ id }, { status: 201 });
}
