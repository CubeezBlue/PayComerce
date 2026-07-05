import { readableOn, towardReadable } from "./colors";

// Resuelve la paleta elegida (3 colores) en un set de variables CSS con
// contraste garantizado. El resto de los colores se deriva automáticamente.
export function resolveTheme(settings: Record<string, string>): Record<string, string> {
  const bg = settings.color_bg || "#FAFAF9";
  const header = settings.color_header || "#FFFFFF";
  const accent = settings.color_accent || settings.brand_color || "#EA580C";

  // Superficie de tarjetas: fija y siempre legible sobre cualquier fondo.
  const card = "#FFFFFF";

  return {
    "--c-bg": bg,
    "--c-text": readableOn(bg), // texto general sobre el fondo
    "--c-muted": towardReadable(readableOn(bg) === "#ffffff" ? "#cbd5e1" : "#6b7280", bg, 3),

    "--c-header": header,
    "--c-header-text": readableOn(header),
    "--accent-on-header": towardReadable(accent, header, 4.5),

    "--brand": accent, // relleno de botones/acentos
    "--brand-text": readableOn(accent), // texto sobre el relleno de acento

    "--c-title": towardReadable(accent, bg, 4.5), // títulos con tono de marca sobre el fondo
    "--accent-ink": towardReadable(accent, card, 4.5), // acento como texto/links sobre tarjeta blanca

    "--c-card": card,
    "--c-card-text": "#1C1917",
    "--c-card-muted": "#6B7280",
  };
}
