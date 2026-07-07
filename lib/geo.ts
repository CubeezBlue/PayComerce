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
