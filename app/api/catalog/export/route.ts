import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCategories, getProductsWithBranches, getBranches } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

// Exporta el catálogo completo a Excel (disponible en todos los planes, sin restricciones).
export async function GET(req: NextRequest) {
  const gErr = await guardPerm("precios");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const db = storeDbFromReq(req);
  const categories = new Map(getCategories(db).map((c) => [c.id, c.name]));
  const branches = getBranches(false, db);
  // Exportamos las imágenes como URL absoluta (https://tutienda/...) para que sean
  // clicleables/portables y no se "rompan" al abrir el Excel fuera del sitio.
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const origin = host ? `${proto}://${host}` : "";
  const absImg = (u: string) => (u && u.startsWith("/") ? origin + u : u);
  const rows = getProductsWithBranches(false, db).map((p) => {
    const row: Record<string, unknown> = {
      ID: p.id,
      Categoria: p.category_id ? categories.get(p.category_id) ?? "" : "",
      Nombre: p.name,
      Descripcion: p.description,
      Precio: p.price,
      Activo: p.active ? "SI" : "NO",
      Imagen: absImg(p.image_url),
    };
    // Una columna por sucursal: vacío = no está; número = stock; "SI" = ilimitado.
    for (const br of branches) {
      const bs = p.branches.find((b) => b.branch_id === br.id);
      row[`Stock: ${br.name}`] = bs ? (bs.stock ?? "SI") : "";
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 45 }, { wch: 10 }, { wch: 8 }, { wch: 40 }, ...branches.map(() => ({ wch: 16 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Catalogo");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="catalogo-paycomerce.xlsx"',
    },
  });
}
