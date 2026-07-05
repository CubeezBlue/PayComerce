import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCategories, getProductsWithBranches, getBranches } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

// Exporta el catálogo completo a Excel (disponible en todos los planes, sin restricciones).
export function GET(req: NextRequest) {
  const db = storeDbFromReq(req);
  const categories = new Map(getCategories(db).map((c) => [c.id, c.name]));
  const branches = getBranches(false, db);
  const rows = getProductsWithBranches(false, db).map((p) => {
    // Stock de referencia: el de la primera sucursal asignada
    const first = p.branches[0];
    return {
      ID: p.id,
      Categoria: p.category_id ? categories.get(p.category_id) ?? "" : "",
      Nombre: p.name,
      Descripcion: p.description,
      Precio: p.price,
      Stock: first ? first.stock ?? "" : "",
      Activo: p.active ? "SI" : "NO",
      Imagen: p.image_url,
      Sucursales: p.branches
        .map((b) => branches.find((x) => x.id === b.branch_id)?.name)
        .filter(Boolean)
        .join(", "),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 6 }, { wch: 18 }, { wch: 30 }, { wch: 45 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 40 }, { wch: 24 }];
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
