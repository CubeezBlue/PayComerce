import { NextRequest, NextResponse } from "next/server";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

// Aumentos/descuentos de precio por porcentaje, globales o por categoría.
// Body: { percent: number, categoryId?: number|null, rounding: "none"|"ten"|"hundred" }
export async function POST(req: NextRequest) {
  const gErr = await guardPerm("precios");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const b = await req.json();
  const percent = Number(b.percent);
  if (!Number.isFinite(percent) || percent <= -100)
    return NextResponse.json({ error: "Porcentaje inválido" }, { status: 400 });

  const rounding = ["none", "ten", "hundred"].includes(b.rounding) ? b.rounding : "none";
  const factor = 1 + percent / 100;

  const where = b.categoryId ? "WHERE category_id = ?" : "";
  const rows = (
    b.categoryId
      ? db.prepare(`SELECT id, price FROM products ${where}`).all(Number(b.categoryId))
      : db.prepare("SELECT id, price FROM products").all()
  ) as { id: number; price: number }[];

  const update = db.prepare("UPDATE products SET price = ? WHERE id = ?");
  const applyAll = db.transaction(() => {
    for (const row of rows) {
      let newPrice = row.price * factor;
      if (rounding === "ten") newPrice = Math.round(newPrice / 10) * 10;
      else if (rounding === "hundred") newPrice = Math.round(newPrice / 100) * 100;
      else newPrice = Math.round(newPrice * 100) / 100;
      update.run(newPrice, row.id);
    }
  });
  applyAll();

  return NextResponse.json({ updated: rows.length });
}
