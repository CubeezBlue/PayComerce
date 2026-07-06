import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

type DB = Database.Database;

// En producción (Hostinger/VPS) apuntar DATA_DIR a una carpeta persistente fuera del build.
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const STORES_DIR = path.join(DATA_DIR, "stores");
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// ----------------------------------------------------------------------------
// Esquema y seed de la base de UN comercio
// ----------------------------------------------------------------------------
function applySchema(db: DB) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  stock INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS product_branches (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  stock INTEGER,
  PRIMARY KEY (product_id, branch_id)
);
CREATE TABLE IF NOT EXISTS delivery_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  min_order REAL NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS option_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_select INTEGER NOT NULL DEFAULT 0,
  max_select INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  branch_id INTEGER,
  customer_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  delivery TEXT NOT NULL DEFAULT 'pickup',
  payment TEXT NOT NULL DEFAULT 'cash',
  notes TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  subtotal REAL NOT NULL DEFAULT 0,
  shipping REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  invoice INTEGER NOT NULL DEFAULT 0,
  cuit TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'nuevo',
  payment_status TEXT NOT NULL DEFAULT 'offline',
  mp_payment_id TEXT NOT NULL DEFAULT '',
  cae TEXT NOT NULL DEFAULT '',
  cae_vto TEXT NOT NULL DEFAULT '',
  invoice_number TEXT NOT NULL DEFAULT '',
  invoice_type TEXT NOT NULL DEFAULT '',
  invoice_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`);

  // Migraciones para bases existentes
  const cols = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name);
  const addCol = (name: string, def: string) => { if (!cols.includes(name)) db.exec(`ALTER TABLE orders ADD COLUMN ${name} ${def}`); };
  addCol("payment_status", "TEXT NOT NULL DEFAULT 'offline'");
  addCol("mp_payment_id", "TEXT NOT NULL DEFAULT ''");
  addCol("cae", "TEXT NOT NULL DEFAULT ''");
  addCol("cae_vto", "TEXT NOT NULL DEFAULT ''");
  addCol("invoice_number", "TEXT NOT NULL DEFAULT ''");
  addCol("invoice_type", "TEXT NOT NULL DEFAULT ''");
  addCol("invoice_demo", "INTEGER NOT NULL DEFAULT 0");
}

// Defaults comunes a toda tienda nueva
function seedDefaults(db: DB, storeName: string, demo: boolean) {
  const ensure = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  const d: Record<string, string> = {
    store_name: storeName,
    whatsapp_number: "",
    currency: "$",
    store_message: "¡Gracias por tu pedido!",
    delivery_cost: "0",
    tagline: demo ? "Cocina de barrio, sabor de siempre" : `Bienvenidos a ${storeName}`,
    hero_subtitle: "Pedí online en 2 minutos. Retiro o delivery, pago en línea o al recibir.",
    hero_image: "",
    logo_url: "",
    about_image: "",
    about_text: demo
      ? "Somos un negocio familiar con más de 15 años cocinando para el barrio. Ingredientes frescos, recetas caseras y la misma dedicación de siempre, ahora también online."
      : "Contá la historia de tu negocio desde el panel de administración.",
    address: demo ? "Av. Colón 1234, Córdoba" : "",
    map_query: demo ? "Av. Colón 1234, Córdoba, Argentina" : "",
    hours: "Lun a Dom de 19:00 a 23:30",
    instagram: "",
    email: "",
    online_payment: "1",
    color_bg: "#FAFAF9",
    color_header: "#FFFFFF",
    color_accent: "#EA580C",
    color_text: "#1C1917",
    business_type: demo ? "restaurante" : "otro",
    mp_access_token: "",
    afip_access_token: "",
    afip_cuit: "",
    afip_condicion: "monotributo",
    afip_punto_venta: "1",
    afip_production: "",
    plan: demo ? "empresa" : "emprendedor",
    addon_mp: demo ? "1" : "",
    addon_arca: demo ? "1" : "",
    addon_delivery: "",
    addon_domain: "",
    hours_json: JSON.stringify({
      "0": { open: true, from: "19:00", to: "23:30" }, "1": { open: true, from: "19:00", to: "23:30" },
      "2": { open: true, from: "19:00", to: "23:30" }, "3": { open: true, from: "19:00", to: "23:30" },
      "4": { open: true, from: "19:00", to: "23:30" }, "5": { open: true, from: "19:00", to: "23:30" },
      "6": { open: true, from: "19:00", to: "23:30" },
    }),
    about_features: JSON.stringify([
      { icon: "⭐", title: "Calidad garantizada", text: "Productos y servicio de primera." },
      { icon: "🚚", title: "Entrega rápida", text: "Recibí tu pedido sin demoras." },
      { icon: "🤝", title: "Atención personalizada", text: "Estamos para ayudarte." },
    ]),
  };
  for (const [k, v] of Object.entries(d)) ensure.run(k, v);

  // Sucursal por defecto
  const bCount = (db.prepare("SELECT COUNT(*) AS c FROM branches").get() as { c: number }).c;
  if (bCount === 0) {
    const s = Object.fromEntries((db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[]).map((r) => [r.key, r.value]));
    const info = db.prepare("INSERT INTO branches (name, address, whatsapp_number, position) VALUES (?, ?, ?, 0)").run("Casa Central", s.address ?? "", s.whatsapp_number ?? "");
    db.prepare("INSERT INTO product_branches (product_id, branch_id, stock) SELECT id, ?, stock FROM products").run(Number(info.lastInsertRowid));
  }
}

function seedDemoCatalog(db: DB) {
  const count = (db.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }).c;
  if (count > 0) return;
  const insertCat = db.prepare("INSERT INTO categories (name, position) VALUES (?, ?)");
  const catPizzas = insertCat.run("Pizzas", 0).lastInsertRowid;
  const catBurgers = insertCat.run("Hamburguesas", 1).lastInsertRowid;
  const catBebidas = insertCat.run("Bebidas", 2).lastInsertRowid;
  const insertProd = db.prepare("INSERT INTO products (category_id, name, description, price, stock, position) VALUES (?, ?, ?, ?, ?, ?)");
  const rows: [unknown, string, string, number, number | null, number][] = [
    [catPizzas, "Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500, null, 0],
    [catPizzas, "Pizza Napolitana", "Muzzarella, tomate en rodajas y ajo", 11000, null, 1],
    [catPizzas, "Pizza Fugazzeta", "Cebolla, muzzarella y provenzal", 10500, null, 2],
    [catBurgers, "Burger Clásica", "Medallón de carne, lechuga, tomate y cheddar", 8500, null, 0],
    [catBurgers, "Burger Doble Bacon", "Doble medallón, bacon crocante y cheddar", 12000, null, 1],
    [catBebidas, "Coca-Cola 1.5L", "", 3500, 24, 0],
    [catBebidas, "Agua Mineral 500ml", "", 1800, 30, 1],
  ];
  for (const r of rows) insertProd.run(...r);
  const b = db.prepare("SELECT id FROM branches ORDER BY id LIMIT 1").get() as { id: number } | undefined;
  if (b) db.prepare("INSERT OR IGNORE INTO product_branches (product_id, branch_id, stock) SELECT id, ?, stock FROM products").run(b.id);
}

// ----------------------------------------------------------------------------
// Registro de comercios + conexión por slug
// ----------------------------------------------------------------------------
const registry = new Database(path.join(DATA_DIR, "_registry.db"));
registry.pragma("journal_mode = WAL");
registry.exec(`CREATE TABLE IF NOT EXISTS stores (slug TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL)`);

export type StoreInfo = { slug: string; name: string; created_at: string };

const connections = new Map<string, DB>();

function fileForSlug(slug: string): string {
  // La tienda "demo" mantiene la base histórica; el resto en /stores/<slug>.db
  return slug === "demo" ? path.join(DATA_DIR, "paycomerce.db") : path.join(STORES_DIR, `${slug}.db`);
}

export function getStoreDb(slug: string): DB {
  const cached = connections.get(slug);
  if (cached) return cached;
  const isDemo = slug === "demo";
  const db = new Database(fileForSlug(slug));
  applySchema(db);
  const reg = registry.prepare("SELECT name FROM stores WHERE slug = ?").get(slug) as { name: string } | undefined;
  seedDefaults(db, reg?.name || (isDemo ? "PayComerce Demo" : slug), isDemo);
  if (isDemo) seedDemoCatalog(db);
  connections.set(slug, db);
  return db;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(slug);
}

export function storeExists(slug: string): boolean {
  return !!registry.prepare("SELECT 1 FROM stores WHERE slug = ?").get(slug);
}

export function listStores(): StoreInfo[] {
  return registry.prepare("SELECT * FROM stores ORDER BY created_at").all() as StoreInfo[];
}

export function getStore(slug: string): StoreInfo | null {
  return (registry.prepare("SELECT * FROM stores WHERE slug = ?").get(slug) as StoreInfo) ?? null;
}

// Para el panel de dueño: cada tienda con su plan, addons y métricas básicas.
export type StoreOverview = StoreInfo & {
  plan: string;
  addons: string[];
  products: number;
  orders: number;
  mpConfigured: boolean;
};

export function listStoresWithInfo(): StoreOverview[] {
  return listStores().map((s) => {
    try {
      const sdb = getStoreDb(s.slug);
      const settings = getSettings(sdb);
      const addonKeys = ["mp", "arca", "delivery", "domain"];
      const addons = addonKeys.filter((k) => settings[`addon_${k}`] === "1");
      const products = (sdb.prepare("SELECT COUNT(*) c FROM products").get() as { c: number }).c;
      const orders = (sdb.prepare("SELECT COUNT(*) c FROM orders").get() as { c: number }).c;
      return {
        ...s,
        plan: settings.plan || "emprendedor",
        addons,
        products,
        orders,
        mpConfigured: !!settings.mp_access_token?.trim(),
      };
    } catch {
      return { ...s, plan: "—", addons: [], products: 0, orders: 0, mpConfigured: false };
    }
  });
}

export function createStore(slug: string, name: string, createdAt: string, passwordHash?: string, plan?: string): StoreInfo {
  registry.prepare("INSERT INTO stores (slug, name, created_at) VALUES (?, ?, ?)").run(slug, name, createdAt);
  const db = getStoreDb(slug); // crea y siembra la base del comercio
  db.prepare("UPDATE settings SET value = ? WHERE key = 'store_name'").run(name);
  if (passwordHash) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(passwordHash);
  }
  if (plan) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('plan', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(plan);
  }
  return { slug, name, created_at: createdAt };
}

// Asegurar que 'demo' esté registrado (para el comercio de ejemplo existente)
if (!storeExists("demo")) {
  registry.prepare("INSERT INTO stores (slug, name, created_at) VALUES ('demo', 'PayComerce Demo', ?)").run(new Date().toISOString());
}

// Base por defecto = tienda demo (compatibilidad con código existente)
const db = getStoreDb("demo");
export default db;

// ----------------------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------------------
export type Category = { id: number; name: string; position: number };
export type Product = {
  id: number; category_id: number | null; name: string; description: string;
  price: number; image_url: string; stock: number | null; active: number; position: number;
};
export type Branch = { id: number; name: string; address: string; whatsapp_number: string; active: number; position: number };
export type BranchStock = { branch_id: number; stock: number | null };
export type DeliveryZone = { id: number; name: string; cost: number; min_order: number; active: number; position: number };
export type OptionItem = { id: number; group_id: number; name: string; price: number; position: number };
export type OptionGroup = { id: number; product_id: number; name: string; min_select: number; max_select: number; position: number; options: OptionItem[] };
export type StoreProduct = Product & { branches: BranchStock[]; optionGroups: OptionGroup[] };

// ----------------------------------------------------------------------------
// Funciones de datos (reciben la base del comercio; por defecto la demo)
// ----------------------------------------------------------------------------
export function getSettings(database: DB = db): Record<string, string> {
  const rows = database.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export function getCategories(database: DB = db): Category[] {
  return database.prepare("SELECT * FROM categories ORDER BY position, id").all() as Category[];
}

export function getProducts(onlyActive = false, database: DB = db): Product[] {
  const where = onlyActive ? "WHERE active = 1" : "";
  return database.prepare(`SELECT * FROM products ${where} ORDER BY position, id`).all() as Product[];
}

export function getProductOptionGroups(productId: number, database: DB = db): OptionGroup[] {
  const groups = database.prepare("SELECT * FROM option_groups WHERE product_id = ? ORDER BY position, id").all(productId) as Omit<OptionGroup, "options">[];
  const opts = database.prepare("SELECT * FROM options WHERE group_id = ? ORDER BY position, id");
  return groups.map((g) => ({ ...g, options: opts.all(g.id) as OptionItem[] }));
}

export function setProductOptions(productId: number, groups: { name: string; min_select: number; max_select: number; options: { name: string; price: number }[] }[], database: DB = db) {
  const delGroups = database.prepare("DELETE FROM option_groups WHERE product_id = ?");
  const insGroup = database.prepare("INSERT INTO option_groups (product_id, name, min_select, max_select, position) VALUES (?, ?, ?, ?, ?)");
  const insOpt = database.prepare("INSERT INTO options (group_id, name, price, position) VALUES (?, ?, ?, ?)");
  const run = database.transaction(() => {
    delGroups.run(productId);
    groups.forEach((g, gi) => {
      if (!g.name?.trim()) return;
      const gid = Number(insGroup.run(productId, g.name.trim(), g.min_select, g.max_select, gi).lastInsertRowid);
      (g.options ?? []).forEach((o, oi) => { if (o.name?.trim()) insOpt.run(gid, o.name.trim(), Number(o.price) || 0, oi); });
    });
  });
  run();
}

export function getBranches(onlyActive = false, database: DB = db): Branch[] {
  const where = onlyActive ? "WHERE active = 1" : "";
  return database.prepare(`SELECT * FROM branches ${where} ORDER BY position, id`).all() as Branch[];
}

export function getDeliveryZones(onlyActive = false, database: DB = db): DeliveryZone[] {
  const where = onlyActive ? "WHERE active = 1" : "";
  return database.prepare(`SELECT * FROM delivery_zones ${where} ORDER BY position, id`).all() as DeliveryZone[];
}

export function getProductsWithBranches(onlyActive = false, database: DB = db): StoreProduct[] {
  const products = getProducts(onlyActive, database);
  const rows = database.prepare("SELECT product_id, branch_id, stock FROM product_branches").all() as { product_id: number; branch_id: number; stock: number | null }[];
  const byProduct = new Map<number, BranchStock[]>();
  for (const r of rows) {
    if (!byProduct.has(r.product_id)) byProduct.set(r.product_id, []);
    byProduct.get(r.product_id)!.push({ branch_id: r.branch_id, stock: r.stock });
  }
  const allGroups = database.prepare("SELECT * FROM option_groups ORDER BY position, id").all() as Omit<OptionGroup, "options">[];
  const allOpts = database.prepare("SELECT * FROM options ORDER BY position, id").all() as OptionItem[];
  const optsByGroup = new Map<number, OptionItem[]>();
  for (const o of allOpts) {
    if (!optsByGroup.has(o.group_id)) optsByGroup.set(o.group_id, []);
    optsByGroup.get(o.group_id)!.push(o);
  }
  const groupsByProduct = new Map<number, OptionGroup[]>();
  for (const g of allGroups) {
    if (!groupsByProduct.has(g.product_id)) groupsByProduct.set(g.product_id, []);
    groupsByProduct.get(g.product_id)!.push({ ...g, options: optsByGroup.get(g.id) ?? [] });
  }
  return products.map((p) => ({ ...p, branches: byProduct.get(p.id) ?? [], optionGroups: groupsByProduct.get(p.id) ?? [] }));
}

export function setProductBranches(productId: number, branches: BranchStock[], database: DB = db) {
  const del = database.prepare("DELETE FROM product_branches WHERE product_id = ?");
  const ins = database.prepare("INSERT INTO product_branches (product_id, branch_id, stock) VALUES (?, ?, ?)");
  const run = database.transaction(() => {
    del.run(productId);
    for (const b of branches) ins.run(productId, b.branch_id, b.stock);
  });
  run();
}

// ----- Pedidos -----
export type OrderItem = { product_id?: number; name: string; qty: number; price: number };
export type Order = {
  id: number; code: string; branch_id: number | null; customer_name: string; phone: string; address: string;
  delivery: string; payment: string; notes: string; items: OrderItem[]; subtotal: number; shipping: number; total: number;
  invoice: number; cuit: string; status: string; payment_status: string; mp_payment_id: string;
  cae: string; cae_vto: string; invoice_number: string; invoice_type: string; invoice_demo: number; created_at: string;
};
export const ORDER_STATUSES = ["nuevo", "preparacion", "listo", "entregado"] as const;

type NewOrder = {
  code: string; branch_id: number | null; customer_name: string; phone: string; address: string;
  delivery: string; payment: string; notes: string; items: OrderItem[]; subtotal: number; shipping: number; total: number;
  invoice: boolean; cuit: string; payment_status: string; created_at: string;
};

export function createOrder(o: NewOrder, database: DB = db): number {
  const insert = database.prepare(
    `INSERT INTO orders (code, branch_id, customer_name, phone, address, delivery, payment, notes, items, subtotal, shipping, total, invoice, cuit, status, payment_status, created_at)
     VALUES (@code, @branch_id, @customer_name, @phone, @address, @delivery, @payment, @notes, @items, @subtotal, @shipping, @total, @invoice, @cuit, 'nuevo', @payment_status, @created_at)`
  );
  const decStock = database.prepare(`UPDATE product_branches SET stock = MAX(0, stock - ?) WHERE product_id = ? AND branch_id = ? AND stock IS NOT NULL`);
  const getStock = database.prepare(`SELECT stock FROM product_branches WHERE product_id = ? AND branch_id = ?`);
  const tx = database.transaction(() => {
    // Validación de stock: si algún ítem supera lo disponible, cancelamos todo el pedido.
    if (o.branch_id != null) {
      const short: string[] = [];
      for (const it of o.items ?? []) {
        if (it.product_id == null || it.qty <= 0) continue;
        const row = getStock.get(it.product_id, o.branch_id) as { stock: number | null } | undefined;
        if (row && row.stock != null && it.qty > row.stock) short.push(`${it.name} (disponible: ${row.stock})`);
      }
      if (short.length) throw new OutOfStockError(short);
    }
    const info = insert.run({ ...o, items: JSON.stringify(o.items ?? []), invoice: o.invoice ? 1 : 0 });
    if (o.branch_id != null) for (const it of o.items ?? []) if (it.product_id != null && it.qty > 0) decStock.run(it.qty, it.product_id, o.branch_id);
    return Number(info.lastInsertRowid);
  });
  return tx();
}

// Error de stock insuficiente al crear un pedido (lista de ítems afectados).
export class OutOfStockError extends Error {
  items: string[];
  constructor(items: string[]) {
    super("Sin stock suficiente");
    this.name = "OutOfStockError";
    this.items = items;
  }
}

export function getOrders(opts: { branchId?: number | null } = {}, database: DB = db): Order[] {
  const rows = database.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all() as (Omit<Order, "items"> & { items: string })[];
  let list = rows.map((r) => ({ ...r, items: safeItems(r.items) }));
  if (opts.branchId != null) list = list.filter((r) => r.branch_id === opts.branchId);
  return list;
}

export type SalesStats = {
  todaySales: number; todayCount: number; todayAvg: number; monthSales: number; totalOrders: number;
  topProducts: { name: string; qty: number; revenue: number }[]; last7: { label: string; total: number }[];
};

export function getSalesStats(database: DB = db): SalesStats {
  const rows = database.prepare("SELECT total, items, created_at FROM orders WHERE status != 'cancelado'").all() as { total: number; items: string; created_at: string }[];
  const now = new Date();
  const todayStr = now.toDateString();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  let todaySales = 0, todayCount = 0, monthSales = 0;
  const productMap = new Map<string, { qty: number; revenue: number }>();
  const days: { key: string; label: string; total: number }[] = [];
  const short = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(now.getTime() - i * 86400000);
    days.push({ key: dd.toDateString(), label: short[dd.getDay()], total: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  for (const r of rows) {
    const dd = new Date(r.created_at);
    const dStr = dd.toDateString();
    if (dStr === todayStr) { todaySales += r.total; todayCount++; }
    if (`${dd.getFullYear()}-${dd.getMonth()}` === monthKey) monthSales += r.total;
    const di = dayIndex.get(dStr);
    if (di !== undefined) days[di].total += r.total;
    try {
      const items = JSON.parse(r.items) as { name: string; qty: number; price: number }[];
      for (const it of items) {
        const cur = productMap.get(it.name) ?? { qty: 0, revenue: 0 };
        cur.qty += it.qty; cur.revenue += it.qty * it.price; productMap.set(it.name, cur);
      }
    } catch {}
  }
  const topProducts = [...productMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 5);
  return { todaySales, todayCount, todayAvg: todayCount ? todaySales / todayCount : 0, monthSales, totalOrders: rows.length, topProducts, last7: days.map((d) => ({ label: d.label, total: d.total })) };
}

export type InvoiceData = { cae: string; cae_vto: string; invoice_number: string; invoice_type: string; invoice_demo: boolean };

export function saveInvoice(orderId: number, inv: InvoiceData, database: DB = db): boolean {
  const info = database.prepare("UPDATE orders SET cae = ?, cae_vto = ?, invoice_number = ?, invoice_type = ?, invoice_demo = ? WHERE id = ?")
    .run(inv.cae, inv.cae_vto, inv.invoice_number, inv.invoice_type, inv.invoice_demo ? 1 : 0, orderId);
  return info.changes > 0;
}

export function getOrderById(id: number, database: DB = db): Order | null {
  const row = database.prepare("SELECT * FROM orders WHERE id = ?").get(id) as (Omit<Order, "items"> & { items: string }) | undefined;
  return row ? { ...row, items: safeItems(row.items) } : null;
}

export function updatePaymentStatus(orderId: number, paymentStatus: string, mpPaymentId?: string, database: DB = db): boolean {
  const info = database.prepare("UPDATE orders SET payment_status = ?, mp_payment_id = COALESCE(?, mp_payment_id) WHERE id = ?")
    .run(paymentStatus, mpPaymentId ?? null, orderId);
  return info.changes > 0;
}

function safeItems(raw: string): OrderItem[] {
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}

export function updateOrderStatus(id: number, status: string, database: DB = db): boolean {
  return database.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id).changes > 0;
}

export function cancelOrder(id: number, database: DB = db): boolean {
  const row = database.prepare("SELECT * FROM orders WHERE id = ?").get(id) as (Omit<Order, "items"> & { items: string }) | undefined;
  if (!row) return false;
  if (row.status === "cancelado") return true;
  const items = safeItems(row.items);
  const inc = database.prepare("UPDATE product_branches SET stock = stock + ? WHERE product_id = ? AND branch_id = ? AND stock IS NOT NULL");
  const tx = database.transaction(() => {
    if (row.branch_id != null) for (const it of items) if (it.product_id != null && it.qty > 0) inc.run(it.qty, it.product_id, row.branch_id);
    database.prepare("UPDATE orders SET status = 'cancelado' WHERE id = ?").run(id);
  });
  tx();
  return true;
}

export function deleteOrder(id: number, database: DB = db): boolean {
  return database.prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0;
}

export function clearFinalizedOrders(database: DB = db): number {
  return database.prepare("DELETE FROM orders WHERE status IN ('entregado', 'cancelado')").run().changes;
}
