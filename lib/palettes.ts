// Paleta única de 3 colores por rol, editable por el comercio.
// Los colores de TEXTO no se eligen: se calculan solos para garantizar contraste.
// 1. Fondo        -> color de fondo de la página        (color_bg)
// 2. Header/Footer -> barra superior y pie              (color_header)
// 3. Acento       -> botones, títulos y detalles        (color_accent)

export type PaletteRole = {
  key: "color_bg" | "color_header" | "color_accent";
  name: string;
  description: string;
};

export const PALETTE_ROLES: PaletteRole[] = [
  { key: "color_bg", name: "Fondo", description: "Color de fondo de la página" },
  { key: "color_header", name: "Header y footer", description: "Barra superior y pie de página" },
  { key: "color_accent", name: "Acento", description: "Botones, títulos y detalles" },
];

export const DEFAULT_PALETTE: Record<PaletteRole["key"], string> = {
  color_bg: "#FAFAF9",
  color_header: "#FFFFFF",
  color_accent: "#EA580C",
};

// Combinaciones probadas (contraste garantizado). Punto de partida rápido.
export const PRESET_PALETTES: { name: string; colors: Record<PaletteRole["key"], string> }[] = [
  { name: "Naranja cálido", colors: { color_bg: "#FAFAF9", color_header: "#FFFFFF", color_accent: "#EA580C" } },
  { name: "Rojo clásico", colors: { color_bg: "#FBF7F5", color_header: "#7F1D1D", color_accent: "#DC2626" } },
  { name: "Verde fresco", colors: { color_bg: "#F7FBF7", color_header: "#FFFFFF", color_accent: "#16A34A" } },
  { name: "Azul confianza", colors: { color_bg: "#F6F8FC", color_header: "#0F2A4A", color_accent: "#2563EB" } },
  { name: "Noche elegante", colors: { color_bg: "#0F172A", color_header: "#111827", color_accent: "#38BDF8" } },
  { name: "Violeta moderno", colors: { color_bg: "#FAF7FF", color_header: "#FFFFFF", color_accent: "#7C3AED" } },
  { name: "Turquesa", colors: { color_bg: "#F2FBFA", color_header: "#0D3B37", color_accent: "#0D9488" } },
  { name: "Rosa dulce", colors: { color_bg: "#FFF7FB", color_header: "#FFFFFF", color_accent: "#DB2777" } },
];

// Colores sugeridos al editar un rol (también puede elegir uno propio).
export const SUGGESTED_COLORS: string[] = [
  "#FFFFFF", "#FAFAF9", "#F5F5F4", "#FFF7ED", "#FEFCE8", "#F0FDF4", "#EFF6FF", "#FDF2F8",
  "#1C1917", "#111827", "#0F172A", "#0D3B37", "#7F1D1D", "#374151",
  "#EA580C", "#DC2626", "#E11D48", "#DB2777", "#7C3AED", "#2563EB",
  "#0EA5E9", "#0D9488", "#16A34A", "#F59E0B", "#38BDF8", "#FF9F1C",
];
