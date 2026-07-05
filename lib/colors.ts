// Utilidades de color para garantizar contraste legible con cualquier paleta.

export function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || "").trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Luminancia relativa WCAG
function relLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Devuelve blanco o casi-negro, el que mejor contraste tenga sobre `bg`.
export function readableOn(bg: string): string {
  return contrastRatio("#ffffff", bg) >= contrastRatio("#111827", bg) ? "#ffffff" : "#111827";
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// Ajusta `fg` hacia el color legible sobre `bg` lo mínimo necesario para
// alcanzar el ratio pedido, preservando lo más posible el tono elegido.
export function towardReadable(fg: string, bg: string, ratio = 4.5): string {
  if (contrastRatio(fg, bg) >= ratio) return fg;
  const target = readableOn(bg);
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const c = mix(fg, target, t);
    if (contrastRatio(c, bg) >= ratio) return c;
  }
  return target;
}
