export function formatPrice(value: number, currency = "$"): string {
  const n = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency}${n}`;
}
