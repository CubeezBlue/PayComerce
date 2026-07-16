import { NextRequest, NextResponse } from "next/server";
import { setProductBranches, BranchStock } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("productos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const { id } = await params;
  const b = await req.json();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(Number(id));
  if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

  const price = Number(b.price);
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });

  db.prepare(
    `UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, stock = ?, active = ?
     WHERE id = ?`
  ).run(
    b.category_id ?? null,
    String(b.name ?? "").trim(),
    String(b.description ?? ""),
    price,
    String(b.image_url ?? ""),
    b.stock === null || b.stock === undefined || b.stock === "" ? null : Number(b.stock),
    b.active === false || b.active === 0 ? 0 : 1,
    Number(id)
  );

  // Actualizar disponibilidad y stock por sucursal si vienen en el body
  if (Array.isArray(b.branches)) {
    const branches: BranchStock[] = b.branches
      .filter((x: { branch_id?: unknown }) => x && Number.isFinite(Number(x.branch_id)))
      .map((x: { branch_id: unknown; stock?: unknown }) => ({
        branch_id: Number(x.branch_id),
        stock: x.stock === null || x.stock === undefined || x.stock === "" ? null : Number(x.stock),
      }));
    setProductBranches(Number(id), branches, db);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("productos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const { id } = await params;
  const info = db.prepare("DELETE FROM products WHERE id = ?").run(Number(id));
  if (info.changes === 0) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
