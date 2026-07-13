// Definición central de planes e integraciones de PayComerce.
// La app está construida "full"; cada plan destraba un subconjunto de funciones.

export type Feature =
  | "variants"
  | "excel"
  | "price_adjust"
  | "orders_board"
  | "dashboard_full"
  | "branches";

export type PlanId = "emprendedor" | "profesional" | "empresa";

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // ARS / mes
  tagline: string;
  productLimit: number | null; // null = ilimitado
  features: Feature[];
  includedAddons: AddonKey[]; // integraciones incluidas sin costo extra
};

export const PLANS: Record<PlanId, Plan> = {
  emprendedor: {
    id: "emprendedor",
    name: "Emprendedor",
    price: 30000,
    tagline: "Para el comercio que arranca a vender online.",
    productLimit: 50,
    features: [],
    includedAddons: [],
  },
  profesional: {
    id: "profesional",
    name: "Profesional",
    price: 50000,
    tagline: "Para el negocio que ya vende y quiere gestionar todo.",
    productLimit: null,
    features: ["variants", "excel", "price_adjust", "orders_board", "dashboard_full"],
    includedAddons: [],
  },
  empresa: {
    id: "empresa",
    name: "Empresa",
    price: 100000,
    tagline: "Multisucursal con pagos online incluidos, para crecer sin límites.",
    productLimit: null,
    features: ["variants", "excel", "price_adjust", "orders_board", "dashboard_full", "branches"],
    includedAddons: ["mp"],
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
};

export type AddonKey = "mp" | "arca" | "delivery" | "caja" | "equipos" | "mesas" | "cocina" | "domain";

export const ADDONS: { key: AddonKey; name: string; price: number; icon: string; desc: string; features?: string[]; soon?: boolean }[] = [
  { key: "mp", name: "Pagos online (Mercado Pago)", price: 6900, icon: "💳", desc: "Cobrá con tarjeta y MP en la web." },
  { key: "arca", name: "Facturación electrónica (ARCA)", price: 12500, icon: "🧾", desc: "Factura A/B/C automática con tu CUIT." },
  { key: "delivery", name: "Delivery y zonas de envío", price: 18500, icon: "🛵", desc: "Costo de envío por zona o zona dibujada en el mapa." },
  { key: "caja", name: "Caja y arqueo", price: 5000, icon: "💰", desc: "Cierre diario por medio de pago (efectivo, transferencia, MP) y arqueo." },
  { key: "equipos", name: "Equipo y empleados", price: 15000, icon: "👥", desc: "Usuarios para tus empleados con permisos por sección." },
  {
    key: "mesas", name: "Servicio de mesas", price: 0, icon: "🍽️", soon: true,
    desc: "Vendé por mesa y controlá el salón.",
    features: [
      "Ventas en mesas",
      "Mapa de salas y mesas en la web y la app móvil",
      "Asignación de ventas a meseros",
      "Traslado de consumos de una mesa a otra",
      "Estadísticas de mesas con más ventas",
    ],
  },
  {
    key: "cocina", name: "Monitor de cocina (KDS)", price: 0, icon: "👨‍🍳", soon: true,
    desc: "Comandas digitales para la cocina en tiempo real.",
    features: [
      "Comandas 100% digitales",
      "Configuración de tiempos de preparación",
      "Alertas sonoras en tiempo real",
      "Disponible para múltiples dispositivos",
      "Aviso al camarero cuando la orden está lista",
    ],
  },
  { key: "domain", name: "Dominio propio", price: 4900, icon: "🌐", desc: "tutienda.com en vez de un subdominio.", soon: true },
];

export function planOf(settings: Record<string, string>): PlanId {
  const p = settings.plan as PlanId;
  return p && PLANS[p] ? p : "empresa";
}

export function hasFeature(settings: Record<string, string>, f: Feature): boolean {
  return PLANS[planOf(settings)].features.includes(f);
}

// ¿La integración viene incluida sin costo en el plan actual?
export function addonIncludedInPlan(settings: Record<string, string>, key: AddonKey): boolean {
  return PLANS[planOf(settings)].includedAddons.includes(key);
}

export function hasAddon(settings: Record<string, string>, key: AddonKey): boolean {
  return addonIncludedInPlan(settings, key) || settings[`addon_${key}`] === "1";
}

export function productLimit(settings: Record<string, string>): number | null {
  return PLANS[planOf(settings)].productLimit;
}
