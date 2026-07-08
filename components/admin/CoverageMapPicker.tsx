"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LMap, Circle as LCircle } from "leaflet";

// Mapa que muestra el radio de cobertura (círculo) de una sucursal.
// Leaflet se carga dinámicamente (solo en el navegador).
export default function CoverageMapPicker({ lat, lon, km }: { lat: number; lon: number; km: number }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const circleRef = useRef<LCircle | null>(null);

  // Inicializar el mapa una vez (por sucursal).
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !divRef.current || mapRef.current) return;
      const L = mod.default;
      const map = L.map(divRef.current, { scrollWheelZoom: false }).setView([lat, lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([lat, lon], { radius: 6, color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 1, weight: 2 }).addTo(map);
      const circle = L.circle([lat, lon], { radius: km * 1000, color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.12, weight: 2 }).addTo(map);
      circleRef.current = circle;
      mapRef.current = map;
      if (km > 0) map.fitBounds(circle.getBounds(), { padding: [20, 20] });
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; circleRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  // Actualizar el radio del círculo al mover el slider.
  useEffect(() => {
    const c = circleRef.current, m = mapRef.current;
    if (c && m) {
      c.setRadius(km * 1000);
      if (km > 0) m.fitBounds(c.getBounds(), { padding: [20, 20] });
    }
  }, [km]);

  return <div ref={divRef} className="h-64 w-full overflow-hidden rounded-xl ring-1 ring-black/10" style={{ zIndex: 0 }} />;
}
