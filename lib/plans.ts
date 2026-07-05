// Definición central de planes e integraciones de PayComerce.
// La app está construida "full"; cada plan destraba un subconjunto de funciones.

export type Feature =
  | "variants"
  | "excel"
  | "price_adjust"
  | "orders_board"
  | "dashboard_full"
  | "branches"
  | "reports";

export type PlanId = "emprendedor" | "profesional" | "empresa";

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // ARS / mes
  tagline: string;
  productLimit: number | null; // null = ilimitado
  features: Feature[];
};

export const PLANS: Record<PlanId, Plan> = {
  emprendedor: {
    id: "emprendedor",
    name: "Emprendedor",
    price: 14900,
    tagline: "Para el comercio que arranca a vender online.",
    productLimit: 50,
    features: [],
  },
  profesional: {
    id: "profesional",
    name: "Profesional",
    price: 29900,
    tagline: "Para el negocio que ya vende y quiere gestionar todo.",
    productLimit: null,
    features: ["variants", "excel", "price_adjust", "orders_board", "dashboard_full"],
  },
  empresa: {
    id: "empresa",
    name: "Empresa",
    price: 49900,
    tagline: "Para cadenas y comercios con varias sucursales.",
    productLimit: null,
    features: ["variants", "excel", "price_adjust", "orders_board", "dashboard_full", "branches", "reports"],
  },
};

export const PLAN_ORDER: PlanId[] = ["emprendedor", "profesional", "empresa"];

// Descripción legible de cada función (para la landing y el panel)
export const FEATURE_LABELS: Record<Feature, string> = {
  variants: "Variantes y adicionales de productos",
  excel: "Carga masiva por Excel",
  price_adjust: "Aumentos de precio por porcentaje",
  orders_board: "Tablero de pedidos (web, sonido, impresión)",
  dashboard_full: "Dashboard de ventas completo",
  branches: "Multisucursal (menú y stock por sucursal)",
  reports: "Reportes avanzados y listas de precio",
};

export type AddonKey = "mp" | "arca" | "whatsapp_ia" | "delivery" | "domain";

export const ADDONS: { key: AddonKey; name: string; price: number; icon: string; desc: string }[] = [
  { key: "mp", name: "Pagos online (Mercado Pago)", price: 6900, icon: "💳", desc: "Cobrá con tarjeta y MP en la web." },
  { key: "arca", name: "Facturación electrónica (ARCA)", price: 8900, icon: "🧾", desc: "Factura A/B/C automática con tu CUIT." },
  { key: "whatsapp_ia", name: "WhatsApp IA", price: 19900, icon: "🤖", desc: "Un bot atiende y toma pedidos por WhatsApp." },
  { key: "delivery", name: "Delivery y zonas de envío", price: 9900, icon: "🛵", desc: "Costo por zona y gestión de reparto." },
  { key: "domain", name: "Dominio propio", price: 4900, icon: "🌐", desc: "tutienda.com en vez de un subdominio." },
];

export function planOf(settings: Record<string, string>): PlanId {
  const p = settings.plan as PlanId;
  return p && PLANS[p] ? p : "empresa";
}

export function hasFeature(settings: Record<string, string>, f: Feature): boolean {
  return PLANS[planOf(settings)].features.includes(f);
}

export function hasAddon(settings: Record<string, string>, key: AddonKey): boolean {
  return settings[`addon_${key}`] === "1";
}

export function productLimit(settings: Record<string, string>): number | null {
  return PLANS[planOf(settings)].productLimit;
}
