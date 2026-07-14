// Permisos por sección del panel. El dueño siempre los tiene todos; a cada
// empleado se le asigna un subconjunto. (Sin dependencias de crypto → sirve en
// el cliente y en el servidor.)

export const PERMISSIONS = ["pedidos", "mesas", "cocina", "caja", "productos", "precios", "sucursales", "envios", "config"] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  pedidos: "Pedidos",
  mesas: "Mesas (salón)",
  cocina: "Cocina (comandas)",
  caja: "Caja",
  productos: "Productos y stock",
  precios: "Precios y Excel",
  sucursales: "Sucursales",
  envios: "Envíos",
  config: "Configuración y equipo",
};

export const PERMISSION_HINTS: Record<Permission, string> = {
  pedidos: "Ver y gestionar el tablero de pedidos",
  mesas: "Atender el salón: abrir mesas, tomar consumos y cobrar",
  cocina: "Ver el monitor de cocina y marcar comandas listas",
  caja: "Ver las ventas del día y hacer el arqueo",
  productos: "Alta y edición de productos, categorías y stock",
  precios: "Ajustes de precio por % e importación por Excel",
  sucursales: "Administrar las sucursales",
  envios: "Configurar las zonas de delivery",
  config: "Datos de la tienda, plan, integraciones y empleados (solo el dueño)",
};

export function parsePermissions(json: string | null | undefined): Permission[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.filter((p): p is Permission => (PERMISSIONS as readonly string[]).includes(p));
  } catch { /* JSON inválido → sin permisos */ }
  return [];
}
