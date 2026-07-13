import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { storeDbFromReq } from "@/lib/tenant";

// Importación masiva desde Excel. A diferencia de Pedix:
// - Disponible sin restricciones de plan.
// - Crea categorías nuevas automáticamente si no existen.
// - Permite eliminar productos marcando la columna "Eliminar" con SI.
// - Stock POR SUCURSAL: una columna "Stock: <Sucursal>" por cada sucursal.
//   · celda vacía  = el producto NO está en esa sucursal
//   · un número    = está en esa sucursal con ese stock (0 = sin stock)
//   · "SI" / "-"   = está en esa sucursal con stock ilimitado (sin control)
// Compatibilidad: si la planilla no trae columnas por sucursal, se usa la
// columna genérica "Stock" aplicada a todas las sucursales (formato viejo).
// Columnas: ID, Categoria, Nombre, Descripcion, Precio, [Stock | Stock: <Suc>...], Activo, Imagen, Eliminar
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

  // Limpia y valida la URL de imagen de una celda del Excel.
  // Devuelve: string (URL válida) | "" (borrar imagen) | null (dejar la actual).
  const cleanImageUrl = (raw: string): string | null => {
    // Quita espacios raros (nbsp, zero-width) y comillas que a veces pega Excel.
    let u = raw.replace(/[​-‍﻿]/g, "").replace(/ /g, " ").trim().replace(/^["']+|["']+$/g, "");
    if (u === "") return null; // celda vacía → NO tocar la imagen que ya tiene
    if (/^(-|sin|ninguna|borrar|x)$/i.test(u)) return ""; // pidió sacarle la imagen
    // Convierte enlaces "para compartir" a enlaces directos de imagen.
    const gd = u.match(/drive\.google\.com\/file\/d\/([^/?]+)/) || (u.includes("drive.google.com") && u.match(/[?&]id=([^&]+)/));
    if (gd) return `https://drive.google.com/uc?export=view&id=${gd[1]}`;
    if (/dropbox\.com/i.test(u)) return u.replace(/([?&])dl=0\b/, "$1raw=1").replace(/\?dl=0$/, "?raw=1");
    // Aceptamos URLs http(s) o rutas internas del propio sitio.
    if (/^https?:\/\//i.test(u) || u.startsWith("/api/media/") || u.startsWith("/uploads/")) return u;
    return "__invalid__"; // no parece un enlace → avisamos y dejamos la anterior
  };

  const errors: string[] = [];
  let created = 0, updated = 0, deleted = 0, categoriesCreated = 0;

  const allBranches = db.prepare("SELECT id, name FROM branches ORDER BY position, id").all() as { id: number; name: string }[];

  // Detectamos qué columna del Excel corresponde a cada sucursal (si es que hay).
  const headerKeys = rows.length ? Object.keys(rows[0]) : [];
  const canon = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const branchCol = new Map<number, string>(); // branchId -> header exacto
  for (const br of allBranches) {
    const targets = [canon(`stock: ${br.name}`), canon(`stock ${br.name}`), canon(br.name)];
    const key = headerKeys.find((k) => targets.includes(canon(k)));
    if (key) branchCol.set(br.id, key);
  }
  const perBranchMode = branchCol.size > 0;

  // Interpreta el valor de una celda de stock por sucursal.
  // Devuelve: { inBranch: boolean, stock: number|null }
  const parseBranchCell = (raw: string): { inBranch: boolean; stock: number | null } => {
    const v = raw.trim();
    if (v === "") return { inBranch: false, stock: null };
    if (/^(si|sí|s|x|-|∞|ilimitado)$/i.test(v)) return { inBranch: true, stock: null };
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return { inBranch: true, stock: n };
    return { inBranch: false, stock: null }; // valor raro → lo tratamos como "no está"
  };

  const insertPB = db.prepare("INSERT OR IGNORE INTO product_branches (product_id, branch_id, stock) VALUES (?, ?, ?)");
  const upsertPB = db.prepare(
    "INSERT INTO product_branches (product_id, branch_id, stock) VALUES (?, ?, ?) ON CONFLICT(product_id, branch_id) DO UPDATE SET stock = excluded.stock"
  );
  const deletePB = db.prepare("DELETE FROM product_branches WHERE product_id = ? AND branch_id = ?");
  const updatePBStockAll = db.prepare("UPDATE product_branches SET stock = ? WHERE product_id = ?");

  const getCatId = db.prepare("SELECT id FROM categories WHERE lower(name) = lower(?)");
  const insertCat = db.prepare("INSERT INTO categories (name, position) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM categories))");
  const getProd = db.prepare("SELECT id FROM products WHERE id = ?");
  const delProd = db.prepare("DELETE FROM products WHERE id = ?");
  const updProd = db.prepare(
    // COALESCE: si image_url viene NULL (celda vacía), se mantiene la imagen actual.
    "UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = COALESCE(?, image_url), stock = ?, active = ? WHERE id = ?"
  );
  const insProd = db.prepare(
    `INSERT INTO products (category_id, name, description, price, image_url, stock, active, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM products))`
  );

  // Aplica el stock por sucursal de una fila a un producto (crea/actualiza/borra asignaciones).
  const applyBranches = (productId: number, row: Record<string, unknown>) => {
    for (const br of allBranches) {
      const col = branchCol.get(br.id);
      if (!col) continue; // esta sucursal no vino en la planilla → no la tocamos
      const { inBranch, stock } = parseBranchCell(norm(row[col]));
      if (inBranch) upsertPB.run(productId, br.id, stock);
      else deletePB.run(productId, br.id);
    }
  };

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

      // Stock genérico (columna "Stock") — solo para el modo compatibilidad.
      const stockRaw = norm(row["Stock"]);
      const genericStock = stockRaw === "" ? null : Number(stockRaw);
      const active = /^(no|n|0)$/i.test(norm(row["Activo"])) ? 0 : 1;
      const desc = norm(row["Descripcion"]);
      // Imagen: null = no tocar; "" = borrar; string = usar; "__invalid__" = avisar y no tocar.
      let image = cleanImageUrl(norm(row["Imagen"]));
      if (image === "__invalid__") {
        errors.push(`Fila ${line}: la imagen no parece un enlace válido (debe empezar con http) — se dejó la anterior`);
        image = null;
      }

      if (id && getProd.get(id)) {
        updProd.run(categoryId, name, desc, price, image, genericStock, active, id);
        if (perBranchMode) applyBranches(id, row);
        else updatePBStockAll.run(genericStock, id); // formato viejo: mismo stock a todas
        updated++;
      } else {
        const newId = Number(insProd.run(categoryId, name, desc, price, image ?? "", genericStock, active).lastInsertRowid);
        if (perBranchMode) {
          applyBranches(newId, row);
        } else {
          // Formato viejo: producto nuevo disponible en todas las sucursales
          for (const br of allBranches) insertPB.run(newId, br.id, genericStock);
        }
        created++;
      }
    });
  });
  run();

  return NextResponse.json({ created, updated, deleted, categoriesCreated, errors });
}
