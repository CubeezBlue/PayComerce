import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { storeDbFromReq } from "@/lib/tenant";

// Importación masiva desde Excel. A diferencia de Pedix:
// - Disponible sin restricciones de plan.
// - Crea categorías nuevas automáticamente si no existen.
// - Permite eliminar productos marcando la columna "Eliminar" con SI.
// Columnas: ID (opcional, para actualizar), Categoria, Nombre, Descripcion, Precio, Stock, Activo, Imagen, Eliminar
export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(buf, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. Verificá que sea un Excel válido." }, { status: 400 });
  }

  const norm = (v: unknown) => String(v ?? "").trim();
  const errors: string[] = [];
  let created = 0, updated = 0, deleted = 0, categoriesCreated = 0;

  const allBranches = db.prepare("SELECT id FROM branches").all() as { id: number }[];
  const insertPB = db.prepare("INSERT OR IGNORE INTO product_branches (product_id, branch_id, stock) VALUES (?, ?, ?)");
  const updatePBStock = db.prepare("UPDATE product_branches SET stock = ? WHERE product_id = ?");

  const getCatId = db.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)");
  const insertCat = db.prepare("INSERT INTO categories (name, position) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM categories))");
  const getProd = db.prepare("SELECT id FROM products WHERE id = ?");
  const delProd = db.prepare("DELETE FROM products WHERE id = ?");
  const updProd = db.prepare(
    "UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, stock = ?, active = ? WHERE id = ?"
  );
  const insProd = db.prepare(
    `INSERT INTO products (category_id, name, description, price, image_url, stock, active, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM products))`
  );

  const run = db.transaction(() => {
    rows.forEach((row, i) => {
      const line = i + 2; // fila en Excel (1 = encabezado)
      const id = norm(row["ID"]) ? Number(row["ID"]) : null;
      const wantsDelete = /^(si|sí|s|yes|x|1)$/i.test(norm(row["Eliminar"]));

      if (wantsDelete) {
        if (id && getProd.get(id)) { delProd.run(id); deleted++; }
        else errors.push(`Fila ${line}: no se puede eliminar, ID inexistente`);
        return;
      }

      const name = norm(row["Nombre"]);
      if (!name) { errors.push(`Fila ${line}: falta el nombre`); return; }
      const price = Number(row["Precio"]);
      if (!Number.isFinite(price) || price < 0) { errors.push(`Fila ${line}: precio inválido`); return; }

      let categoryId: number | null = null;
      const catName = norm(row["Categoria"]);
      if (catName) {
        const found = getCatId.get(catName) as { id: number } | undefined;
        if (found) categoryId = found.id;
        else { categoryId = Number(insertCat.run(catName).lastInsertRowid); categoriesCreated++; }
      }

      const stockRaw = norm(row["Stock"]);
      const stock = stockRaw === "" ? null : Number(stockRaw);
      const active = /^(no|n|0)$/i.test(norm(row["Activo"])) ? 0 : 1;
      const image = norm(row["Imagen"]);
      const desc = norm(row["Descripcion"]);

      if (id && getProd.get(id)) {
        updProd.run(categoryId, name, desc, price, image, stock, active, id);
        // El stock de la planilla se aplica a las sucursales donde ya está el producto
        updatePBStock.run(stock, id);
        updated++;
      } else {
        const newId = Number(insProd.run(categoryId, name, desc, price, image, stock, active).lastInsertRowid);
        // Producto nuevo: disponible en todas las sucursales con el stock de la planilla
        for (const br of allBranches) insertPB.run(newId, br.id, stock);
        created++;
      }
    });
  });
  run();

  return NextResponse.json({ created, updated, deleted, categoriesCreated, errors });
}
