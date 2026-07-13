// Utilidades de geolocalización para el delivery por radio de cobertura.

import { DeliveryBand } from "./types";

// Distancia en kilómetros entre dos puntos (fórmula de Haversine).
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // radio de la Tierra en km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Dada una distancia, devuelve la franja de cobertura aplicable (la más chica que
// la contiene) o null si está fuera de cobertura (más lejos que la franja mayor).
export function bandForDistance(km: number, bands: DeliveryBand[]): DeliveryBand | null {
  const sorted = [...bands].sort((a, b) => a.max_km - b.max_km);
  for (const b of sorted) if (km <= b.max_km) return b;
  return null;
}

// Zona de delivery dibujada a mano.
export type DeliveryPolygon = { points: [number, number][]; cost: number; min_order: number };

export function parseDeliveryPolygon(json: string | null | undefined): DeliveryPolygon | null {
  if (!json) return null;
  try {
    const p = JSON.parse(json) as DeliveryPolygon;
    if (Array.isArray(p?.points) && p.points.length >= 3) {
      return { points: p.points, cost: Number(p.cost) || 0, min_order: Number(p.min_order) || 0 };
    }
  } catch { /* JSON inválido → sin polígono */ }
  return null;
}

// ¿El punto (lat, lon) cae dentro del polígono? Algoritmo de ray-casting.
// El anillo es una lista de vértices [lat, lon].
export function pointInPolygon(lat: number, lon: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
