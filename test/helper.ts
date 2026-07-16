import Database from "better-sqlite3";
import { createStore, getStoreDb } from "../lib/db";

let counter = 0;

// Crea una tienda nueva y aislada, devuelve su base ya sembrada (1 sucursal, sin productos).
export function freshStore(plan = "empresa"): { slug: string; db: Database.Database } {
  const slug = `t${Date.now()}x${counter++}`;
  createStore(slug, "Tienda Test", new Date().toISOString(), "salt:hash", plan, `${slug}@test.com`);
  return { slug, db: getStoreDb(slug) };
}

export function firstBranchId(db: Database.Database): number {
  return (db.prepare("SELECT id FROM branches ORDER BY id LIMIT 1").get() as { id: number }).id;
}

// Inserta un producto con stock en una sucursal y devuelve su id.
export function addProduct(db: Database.Database, name: string, price: number, stock: number, branchId: number): number {
  const info = db.prepare("INSERT INTO products (name, price, stock, active, position) VALUES (?, ?, ?, 1, 0)").run(name, price, stock);
  const id = Number(info.lastInsertRowid);
  db.prepare("INSERT INTO product_branches (product_id, branch_id, stock) VALUES (?, ?, ?)").run(id, branchId, stock);
  return id;
}
