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
CREATE TABLE IF NOT EXISTS delivery_bands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  max_km REAL NOT NULL DEFAULT 0,
  cost REAL NOT NULL DEFAULT 0,
  min_order REAL NOT NULL DEFAULT 0,
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
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_branches_branch ON product_branches(branch_id);
CREATE TABLE IF NOT EXISTS cash_closures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER,
  day TEXT NOT NULL,
  opening REAL NOT NULL DEFAULT 0,
  counted_cash REAL NOT NULL DEFAULT 0,
  expected_cash REAL NOT NULL DEFAULT 0,
  total_sales REAL NOT NULL DEFAULT 0,
  by_method TEXT NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cash_closures_day ON cash_closures(day);
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE TABLE IF NOT EXISTS table_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Salón',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS dining_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER REFERENCES table_rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  seats INTEGER NOT NULL DEFAULT 4,
  pos_x REAL NOT NULL DEFAULT 20,
  pos_y REAL NOT NULL DEFAULT 20,
  active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS table_carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id INTEGER NOT NULL REFERENCES dining_tables(id) ON DELETE CASCADE,
  waiter TEXT NOT NULL DEFAULT '',
  opened_at TEXT NOT NULL,
  closed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS table_cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id INTEGER NOT NULL REFERENCES table_carts(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dining_tables_room ON dining_tables(room_id);
CREATE INDEX IF NOT EXISTS idx_table_carts_open ON table_carts(table_id, closed);
CREATE INDEX IF NOT EXISTS idx_table_cart_items_cart ON table_cart_items(cart_id);
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
  addCol("table_id", "INTEGER"); // pedido originado en una mesa (servicio de mesas)
  addCol("waiter", "TEXT NOT NULL DEFAULT ''");

  // Migración: ubicación de la sucursal (centro de cobertura de delivery)
  const bcols = (db.prepare("PRAGMA table_info(branches)").all() as { name: string }[]).map((c) => c.name);
  if (!bcols.includes("lat")) db.exec("ALTER TABLE branches ADD COLUMN lat REAL");
  if (!bcols.includes("lon")) db.exec("ALTER TABLE branches ADD COLUMN lon REAL");
  // Zona de delivery dibujada a mano (polígono). JSON: { points:[[lat,lon]...], cost, min_order }
  if (!bcols.includes("delivery_polygon")) db.exec("ALTER TABLE branches ADD COLUMN delivery_polygon TEXT");

  // Migración: normalizar los ítems de pedidos existentes a order_items (idempotente).
  const oiCount = (db.prepare("SELECT COUNT(*) AS c FROM order_items").get() as { c: number }).c;
  if (oiCount === 0) {
    const orders = db.prepare("SELECT id, items FROM orders").all() as { id: number; items: string }[];
    const ins = db.prepare("INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)");
    db.transaction(() => {
      for (const o of orders) {
        let items: OrderItem[] = [];
        try { items = JSON.parse(o.items || "[]"); } catch { items = []; }
        for (const it of items) ins.run(o.id, it.product_id ?? null, String(it.name ?? ""), Number(it.qty) || 0, Number(it.price) || 0);
      }
    })();
  }
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
    addon_delivery: demo ? "1" : "",
    addon_caja: demo ? "1" : "",
    addon_equipos: demo ? "1" : "",
    addon_mesas: demo ? "1" : "",
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
// Migración: columna email en el registro (para login/recuperación por email).
{
  const cols = registry.prepare("PRAGMA table_info(stores)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "email")) registry.exec("ALTER TABLE stores ADD COLUMN email TEXT");
}

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
  revenue: number;      // ventas acumuladas (pedidos no cancelados)
  lastOrder: string | null; // fecha del último pedido
  mpConfigured: boolean;
  paused: boolean;      // tienda en pausa (no operativa)
  email: string | null;
  subState: "trial" | "active" | "expired" | "past_due";
};

export function listStoresWithInfo(): StoreOverview[] {
  return listStores().map((s) => {
    const base = { ...s, email: (s as StoreInfo & { email?: string }).email ?? null };
    try {
      const sdb = getStoreDb(s.slug);
      const settings = getSettings(sdb);
      const addonKeys = ["mp", "arca", "delivery", "caja", "equipos", "mesas", "domain"];
      const addons = addonKeys.filter((k) => settings[`addon_${k}`] === "1");
      const products = (sdb.prepare("SELECT COUNT(*) c FROM products").get() as { c: number }).c;
      const orders = (sdb.prepare("SELECT COUNT(*) c FROM orders").get() as { c: number }).c;
      const agg = sdb.prepare("SELECT COALESCE(SUM(total),0) rev, MAX(created_at) last FROM orders WHERE status != 'cancelado'").get() as { rev: number; last: string | null };
      return {
        ...base,
        plan: settings.plan || "emprendedor",
        addons,
        products,
        orders,
        revenue: agg.rev || 0,
        lastOrder: agg.last,
        mpConfigured: !!settings.mp_access_token?.trim(),
        paused: settings.paused === "1",
        subState: subscriptionState(settings),
      };
    } catch {
      return { ...base, plan: "—", addons: [], products: 0, orders: 0, revenue: 0, lastOrder: null, mpConfigured: false, paused: false, subState: "trial" as const };
    }
  });
}

// Pausar/reactivar una tienda (no operativa mientras esté en pausa).
export function setStorePaused(slug: string, paused: boolean): void {
  getStoreDb(slug).prepare("INSERT INTO settings (key, value) VALUES ('paused', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(paused ? "1" : "");
}

// Eliminar una tienda por completo: registro + base de datos. El demo no se borra.
export function deleteStore(slug: string): boolean {
  if (slug === "demo") return false;
  if (!storeExists(slug)) return false;
  const conn = connections.get(slug);
  if (conn) {
    // Antes de cerrar, vaciamos los datos: si el archivo no se puede borrar
    // (bloqueo de SO), al menos no queda información y no "resucita" con el slug.
    try {
      conn.pragma("foreign_keys = OFF");
      const tables = (conn.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]);
      const tx = conn.transaction(() => { for (const t of tables) conn.prepare(`DELETE FROM "${t.name}"`).run(); });
      tx();
      conn.pragma("wal_checkpoint(TRUNCATE)");
    } catch {}
    try { conn.close(); } catch {}
    connections.delete(slug);
  }
  registry.prepare("DELETE FROM stores WHERE slug = ?").run(slug);
  const file = fileForSlug(slug);
  for (const f of [`${file}-wal`, `${file}-shm`, file]) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  }
  return true;
}

export function getStoreByEmail(email: string): StoreInfo | null {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  return (registry.prepare("SELECT slug, name, created_at FROM stores WHERE lower(email) = ?").get(e) as StoreInfo) ?? null;
}

export function emailExists(email: string): boolean {
  return !!getStoreByEmail(email);
}

// Actualiza la contraseña (hash) de un comercio. Para recuperación de contraseña.
export function setStorePasswordHash(slug: string, passwordHash: string): void {
  getStoreDb(slug).prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(passwordHash);
}

// Guarda varias claves de settings de un comercio (por slug). Para OAuth de MP, etc.
export function setStoreSettings(slug: string, kv: Record<string, string>): void {
  const db = getStoreDb(slug);
  const up = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  const tx = db.transaction(() => { for (const [k, v] of Object.entries(kv)) up.run(k, v); });
  tx();
}

export function createStore(slug: string, name: string, createdAt: string, passwordHash?: string, plan?: string, email?: string): StoreInfo {
  registry.prepare("INSERT INTO stores (slug, name, created_at, email) VALUES (?, ?, ?, ?)").run(slug, name, createdAt, email ? email.trim().toLowerCase() : null);
  const db = getStoreDb(slug); // crea y siembra la base del comercio
  db.prepare("UPDATE settings SET value = ? WHERE key = 'store_name'").run(name);
  if (passwordHash) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(passwordHash);
  }
  if (email) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('admin_email', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(email);
    // Reservado para la verificación por email (cuando se configure el envío).
    db.prepare("INSERT INTO settings (key, value) VALUES ('email_verified', '') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();
  }
  if (plan) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('plan', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(plan);
  }
  // Registro de aceptación de Términos y Política de Privacidad (prueba legal).
  const setKey = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  setKey.run("terms_accepted_at", createdAt);
  setKey.run("terms_version", TERMS_VERSION);
  // Suscripción: arranca en prueba gratis por TRIAL_DAYS días.
  const trialEnds = new Date(new Date(createdAt).getTime() + TRIAL_DAYS * 86400000).toISOString();
  setKey.run("subscription_status", "trial");
  setKey.run("trial_ends_at", trialEnds);
  return { slug, name, created_at: createdAt };
}

// Versión vigente de los Términos y la Política (coincide con "última actualización").
export const TERMS_VERSION = "2026-07-07";
export const TRIAL_DAYS = 14;

// Estado de suscripción calculado (considera el vencimiento de la prueba).
// Devuelve: 'trial' | 'active' | 'expired' (prueba vencida sin pago) | 'paused_billing'.
export function subscriptionState(settings: Record<string, string>, now = Date.now()): "trial" | "active" | "expired" | "past_due" {
  const st = settings.subscription_status || "trial";
  if (st === "active") return "active";
  if (st === "past_due") return "past_due";
  // trial: activa hasta que venza
  const ends = settings.trial_ends_at ? Date.parse(settings.trial_ends_at) : 0;
  if (ends && now > ends) return "expired";
  return "trial";
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
export type Branch = { id: number; name: string; address: string; whatsapp_number: string; active: number; position: number; lat: number | null; lon: number | null; delivery_polygon: string | null };
export type BranchStock = { branch_id: number; stock: number | null };
export type DeliveryZone = { id: number; name: string; cost: number; min_order: number; active: number; position: number };
export type DeliveryBand = { id: number; branch_id: number; max_km: number; cost: number; min_order: number; position: number };
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

// Franjas de cobertura por radio (delivery por sucursal).
export function getDeliveryBands(database: DB = db): DeliveryBand[] {
  return database.prepare("SELECT * FROM delivery_bands ORDER BY branch_id, max_km, id").all() as DeliveryBand[];
}

// Reemplaza todas las franjas de una sucursal.
export function saveDeliveryBands(branchId: number, bands: { max_km: number; cost: number; min_order?: number }[], database: DB = db) {
  const del = database.prepare("DELETE FROM delivery_bands WHERE branch_id = ?");
  const ins = database.prepare("INSERT INTO delivery_bands (branch_id, max_km, cost, min_order, position) VALUES (?, ?, ?, ?, ?)");
  const tx = database.transaction(() => {
    del.run(branchId);
    bands
      .filter((b) => Number(b.max_km) > 0)
      .sort((a, b) => a.max_km - b.max_km)
      .forEach((b, i) => ins.run(branchId, Number(b.max_km) || 0, Number(b.cost) || 0, Number(b.min_order) || 0, i));
  });
  tx();
}

export function setBranchLocation(branchId: number, lat: number | null, lon: number | null, database: DB = db) {
  database.prepare("UPDATE branches SET lat = ?, lon = ? WHERE id = ?").run(lat, lon, branchId);
}

// Guarda (o borra con null) la zona de delivery dibujada a mano de una sucursal.
export function setBranchPolygon(branchId: number, polygonJson: string | null, database: DB = db) {
  database.prepare("UPDATE branches SET delivery_polygon = ? WHERE id = ?").run(polygonJson, branchId);
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
  const insItem = database.prepare("INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)");
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
    const orderId = Number(info.lastInsertRowid);
    // Normalizado: una fila por ítem en order_items (fuente para reportes/caja).
    for (const it of o.items ?? []) insItem.run(orderId, it.product_id ?? null, String(it.name ?? ""), Number(it.qty) || 0, Number(it.price) || 0);
    if (o.branch_id != null) for (const it of o.items ?? []) if (it.product_id != null && it.qty > 0) decStock.run(it.qty, it.product_id, o.branch_id);
    return orderId;
  });
  return tx();
}

// Ítems normalizados de un pedido (desde order_items).
export function getOrderItems(orderId: number, database: DB = db): OrderItem[] {
  return database.prepare("SELECT product_id, name, qty, price FROM order_items WHERE order_id = ? ORDER BY id").all(orderId) as OrderItem[];
}

// ----- Caja (cierre diario / arqueo) -----
export type MethodTotals = { count: number; amount: number };
export type CashReport = {
  day: string;
  branchId: number | null;
  totalSales: number;
  ordersCount: number;
  cancelledCount: number;
  byMethod: { cash: MethodTotals; transfer: MethodTotals; online: MethodTotals };
};
export type CashClosure = {
  id: number; branch_id: number | null; day: string; opening: number; counted_cash: number;
  expected_cash: number; total_sales: number; by_method: string; notes: string; created_at: string;
};

// Rango UTC de un día calendario argentino (UTC-3, sin horario de verano): [day 03:00Z, +24h).
function argDayRange(day: string): { start: string; end: string } {
  const start = `${day}T03:00:00.000Z`;
  const end = new Date(new Date(start).getTime() + 24 * 3600 * 1000).toISOString();
  return { start, end };
}

// Ventas de un día por medio de pago (efectivo / transferencia / Mercado Pago).
export function cashReport(day: string, branchId: number | null, database: DB = db): CashReport {
  const { start, end } = argDayRange(day);
  const params: Record<string, unknown> = { start, end };
  let branchClause = "";
  if (branchId != null) { branchClause = "AND branch_id = @branchId"; params.branchId = branchId; }
  const rows = database.prepare(
    `SELECT payment, status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS amount
     FROM orders WHERE created_at >= @start AND created_at < @end ${branchClause}
     GROUP BY payment, status`
  ).all(params) as { payment: string; status: string; count: number; amount: number }[];

  const byMethod = { cash: { count: 0, amount: 0 }, transfer: { count: 0, amount: 0 }, online: { count: 0, amount: 0 } };
  let totalSales = 0, ordersCount = 0, cancelledCount = 0;
  for (const r of rows) {
    if (r.status === "cancelado") { cancelledCount += r.count; continue; }
    const key = r.payment === "transfer" ? "transfer" : r.payment === "online" ? "online" : "cash";
    byMethod[key].count += r.count;
    byMethod[key].amount += r.amount || 0;
    totalSales += r.amount || 0;
    ordersCount += r.count;
  }
  return { day, branchId, totalSales, ordersCount, cancelledCount, byMethod };
}

// Guarda un cierre de caja (arqueo): recalcula el reporte y deja el snapshot.
export function saveCashClosure(
  input: { branch_id: number | null; day: string; opening: number; counted_cash: number; notes: string },
  database: DB = db,
): number {
  const rep = cashReport(input.day, input.branch_id, database);
  const opening = Number(input.opening) || 0;
  const expected = opening + rep.byMethod.cash.amount;
  const info = database.prepare(
    `INSERT INTO cash_closures (branch_id, day, opening, counted_cash, expected_cash, total_sales, by_method, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(input.branch_id, input.day, opening, Number(input.counted_cash) || 0, expected, rep.totalSales, JSON.stringify(rep.byMethod), input.notes || "", new Date().toISOString());
  return Number(info.lastInsertRowid);
}

export function listCashClosures(branchId: number | null, limit = 30, database: DB = db): CashClosure[] {
  if (branchId != null)
    return database.prepare("SELECT * FROM cash_closures WHERE branch_id = ? ORDER BY id DESC LIMIT ?").all(branchId, limit) as CashClosure[];
  return database.prepare("SELECT * FROM cash_closures ORDER BY id DESC LIMIT ?").all(limit) as CashClosure[];
}

// ----- Empleados (staff) -----
export type Staff = {
  id: number; name: string; username: string; password_hash: string;
  permissions: string; active: number; created_at: string;
};
export type StaffPublic = Omit<Staff, "password_hash">;

const STAFF_PUBLIC = "id, name, username, permissions, active, created_at";

export function listStaff(database: DB = db): StaffPublic[] {
  return database.prepare(`SELECT ${STAFF_PUBLIC} FROM staff ORDER BY id`).all() as StaffPublic[];
}
export function getStaffById(id: number, database: DB = db): Staff | null {
  return (database.prepare("SELECT * FROM staff WHERE id = ?").get(id) as Staff | undefined) ?? null;
}
export function getStaffByUsername(username: string, database: DB = db): Staff | null {
  return (database.prepare("SELECT * FROM staff WHERE lower(username) = lower(?)").get(username) as Staff | undefined) ?? null;
}
export function createStaff(input: { name: string; username: string; password_hash: string; permissions: string[] }, database: DB = db): number {
  const info = database.prepare(
    "INSERT INTO staff (name, username, password_hash, permissions, active, created_at) VALUES (?, ?, ?, ?, 1, ?)"
  ).run(input.name, input.username, input.password_hash, JSON.stringify(input.permissions), new Date().toISOString());
  return Number(info.lastInsertRowid);
}
export function updateStaff(id: number, fields: { name?: string; permissions?: string[]; active?: boolean }, database: DB = db) {
  const sets: string[] = [], vals: unknown[] = [];
  if (fields.name != null) { sets.push("name = ?"); vals.push(fields.name); }
  if (fields.permissions != null) { sets.push("permissions = ?"); vals.push(JSON.stringify(fields.permissions)); }
  if (fields.active != null) { sets.push("active = ?"); vals.push(fields.active ? 1 : 0); }
  if (!sets.length) return;
  vals.push(id);
  database.prepare(`UPDATE staff SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}
export function setStaffPassword(id: number, passwordHash: string, database: DB = db) {
  database.prepare("UPDATE staff SET password_hash = ? WHERE id = ?").run(passwordHash, id);
}
export function deleteStaff(id: number, database: DB = db) {
  database.prepare("DELETE FROM staff WHERE id = ?").run(id);
}

// ----- Servicio de mesas -----
export type TableRoom = { id: number; name: string; position: number };
export type DiningTable = { id: number; room_id: number | null; name: string; seats: number; pos_x: number; pos_y: number; active: number; position: number };
export type TableCartItem = { id: number; cart_id: number; product_id: number | null; name: string; qty: number; price: number };
// Mesa con el estado de su cuenta abierta (para el mapa del salón).
export type TableWithCart = DiningTable & { cart_id: number | null; waiter: string; opened_at: string | null; items: number; total: number };

export function listRooms(database: DB = db): TableRoom[] {
  return database.prepare("SELECT * FROM table_rooms ORDER BY position, id").all() as TableRoom[];
}
export function createRoom(name: string, database: DB = db): number {
  const info = database.prepare("INSERT INTO table_rooms (name, position) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM table_rooms))").run(name || "Salón");
  return Number(info.lastInsertRowid);
}
export function updateRoom(id: number, name: string, database: DB = db) {
  database.prepare("UPDATE table_rooms SET name = ? WHERE id = ?").run(name, id);
}
export function deleteRoom(id: number, database: DB = db) {
  database.prepare("DELETE FROM table_rooms WHERE id = ?").run(id);
}

export function createTable(input: { room_id: number | null; name: string; seats?: number; pos_x?: number; pos_y?: number }, database: DB = db): number {
  const info = database.prepare(
    "INSERT INTO dining_tables (room_id, name, seats, pos_x, pos_y, position) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM dining_tables))"
  ).run(input.room_id, input.name, input.seats ?? 4, input.pos_x ?? 20, input.pos_y ?? 20);
  return Number(info.lastInsertRowid);
}
export function updateTable(id: number, fields: { name?: string; seats?: number; pos_x?: number; pos_y?: number; room_id?: number | null; active?: boolean }, database: DB = db) {
  const sets: string[] = [], vals: unknown[] = [];
  if (fields.name != null) { sets.push("name = ?"); vals.push(fields.name); }
  if (fields.seats != null) { sets.push("seats = ?"); vals.push(fields.seats); }
  if (fields.pos_x != null) { sets.push("pos_x = ?"); vals.push(fields.pos_x); }
  if (fields.pos_y != null) { sets.push("pos_y = ?"); vals.push(fields.pos_y); }
  if (fields.room_id !== undefined) { sets.push("room_id = ?"); vals.push(fields.room_id); }
  if (fields.active != null) { sets.push("active = ?"); vals.push(fields.active ? 1 : 0); }
  if (!sets.length) return;
  vals.push(id);
  database.prepare(`UPDATE dining_tables SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
}
export function deleteTable(id: number, database: DB = db) {
  database.prepare("DELETE FROM dining_tables WHERE id = ?").run(id);
}

// Mesas con el estado de su cuenta abierta (para el mapa del salón).
export function getTablesWithCarts(roomId: number | null, database: DB = db): TableWithCart[] {
  const where = roomId != null ? "WHERE t.room_id = @roomId" : "";
  return database.prepare(
    `SELECT t.*, c.id AS cart_id, COALESCE(c.waiter, '') AS waiter, c.opened_at AS opened_at,
            COALESCE((SELECT SUM(qty) FROM table_cart_items WHERE cart_id = c.id), 0) AS items,
            COALESCE((SELECT SUM(qty * price) FROM table_cart_items WHERE cart_id = c.id), 0) AS total
     FROM dining_tables t
     LEFT JOIN table_carts c ON c.table_id = t.id AND c.closed = 0
     WHERE t.active = 1 ${where ? "AND " + where.slice(6) : ""}
     ORDER BY t.position, t.id`
  ).all(roomId != null ? { roomId } : {}) as TableWithCart[];
}

// Cuenta abierta de una mesa (o null). Si no hay y se pide abrir, la crea.
export function getOpenCart(tableId: number, database: DB = db): { id: number; waiter: string; opened_at: string } | null {
  return (database.prepare("SELECT id, waiter, opened_at FROM table_carts WHERE table_id = ? AND closed = 0 ORDER BY id DESC LIMIT 1").get(tableId) as { id: number; waiter: string; opened_at: string } | undefined) ?? null;
}
export function openCart(tableId: number, waiter: string, database: DB = db): number {
  const existing = getOpenCart(tableId, database);
  if (existing) { if (waiter) database.prepare("UPDATE table_carts SET waiter = ? WHERE id = ?").run(waiter, existing.id); return existing.id; }
  const info = database.prepare("INSERT INTO table_carts (table_id, waiter, opened_at, closed) VALUES (?, ?, ?, 0)").run(tableId, waiter || "", new Date().toISOString());
  return Number(info.lastInsertRowid);
}
export function setCartWaiter(cartId: number, waiter: string, database: DB = db) {
  database.prepare("UPDATE table_carts SET waiter = ? WHERE id = ?").run(waiter, cartId);
}
export function listCartItems(cartId: number, database: DB = db): TableCartItem[] {
  return database.prepare("SELECT * FROM table_cart_items WHERE cart_id = ? ORDER BY id").all(cartId) as TableCartItem[];
}
export function addCartItem(cartId: number, item: { product_id: number | null; name: string; qty: number; price: number }, database: DB = db) {
  // Si el mismo producto ya está, sumamos cantidad en vez de duplicar la línea.
  const existing = item.product_id != null
    ? database.prepare("SELECT id, qty FROM table_cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1").get(cartId, item.product_id) as { id: number; qty: number } | undefined
    : undefined;
  if (existing) database.prepare("UPDATE table_cart_items SET qty = qty + ? WHERE id = ?").run(item.qty, existing.id);
  else database.prepare("INSERT INTO table_cart_items (cart_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)").run(cartId, item.product_id, item.name, item.qty, item.price);
}
export function setCartItemQty(itemId: number, qty: number, database: DB = db) {
  if (qty <= 0) database.prepare("DELETE FROM table_cart_items WHERE id = ?").run(itemId);
  else database.prepare("UPDATE table_cart_items SET qty = ? WHERE id = ?").run(qty, itemId);
}
// Traslada la cuenta abierta de una mesa a otra (fusiona si la destino ya tiene cuenta).
export function moveCart(cartId: number, toTableId: number, database: DB = db) {
  const dest = getOpenCart(toTableId, database);
  if (!dest) { database.prepare("UPDATE table_carts SET table_id = ? WHERE id = ?").run(toTableId, cartId); return; }
  if (dest.id === cartId) return;
  // Fusión: movemos los ítems al carrito destino y cerramos el de origen.
  database.prepare("UPDATE table_cart_items SET cart_id = ? WHERE cart_id = ?").run(dest.id, cartId);
  database.prepare("DELETE FROM table_carts WHERE id = ?").run(cartId);
}
// Cierra la cuenta cobrando: genera un pedido real (alimenta caja/reportes) y marca la cuenta cerrada.
export function closeCart(cartId: number, payment: string, database: DB = db): number | null {
  const cart = database.prepare("SELECT c.id, c.table_id, c.waiter, t.name AS table_name FROM table_carts c JOIN dining_tables t ON t.id = c.table_id WHERE c.id = ? AND c.closed = 0").get(cartId) as { id: number; table_id: number; waiter: string; table_name: string } | undefined;
  if (!cart) return null;
  const items = listCartItems(cartId, database);
  if (!items.length) return null;
  const pay = ["cash", "transfer", "online"].includes(payment) ? payment : "cash";
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const orderId = createOrder({
    code: `MESA-${cart.table_name}`,
    branch_id: null, // servicio en salón: sin descuento de stock por sucursal
    customer_name: `Mesa ${cart.table_name}`,
    phone: "", address: "", delivery: "pickup", payment: pay,
    notes: cart.waiter ? `Mesero: ${cart.waiter}` : "",
    items: items.map((it) => ({ product_id: it.product_id ?? undefined, name: it.name, qty: it.qty, price: it.price })),
    subtotal, shipping: 0, total: subtotal, invoice: false, cuit: "",
    payment_status: pay === "cash" ? "offline" : "approved",
    created_at: new Date().toISOString(),
  }, database);
  database.prepare("UPDATE orders SET table_id = ?, waiter = ? WHERE id = ?").run(cart.table_id, cart.waiter, orderId);
  database.prepare("UPDATE table_carts SET closed = 1 WHERE id = ?").run(cartId);
  return orderId;
}

// Estadísticas: mesas con más ventas (de las cuentas ya cobradas).
export function tableSalesStats(database: DB = db): { table_id: number; name: string; orders: number; total: number }[] {
  return database.prepare(
    `SELECT o.table_id AS table_id, COALESCE(t.name, '—') AS name, COUNT(*) AS orders, COALESCE(SUM(o.total), 0) AS total
     FROM orders o LEFT JOIN dining_tables t ON t.id = o.table_id
     WHERE o.table_id IS NOT NULL AND o.status != 'cancelado'
     GROUP BY o.table_id ORDER BY total DESC`
  ).all() as { table_id: number; name: string; orders: number; total: number }[];
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
