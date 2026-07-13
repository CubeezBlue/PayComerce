"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LMap, Circle as LCircle, Polygon as LPolygon, LayerGroup } from "leaflet";

type LatLng = [number, number];

// Mapa de cobertura de una sucursal. Dos modos:
//  - "radius":  muestra un círculo del tamaño del radio (km).
//  - "polygon": el comercio TOCA el mapa para marcar los vértices de su zona.
// Leaflet se carga dinámicamente (solo en el navegador).
export default function CoverageMapPicker({
  lat, lon, km, mode = "radius", polygon, onPolygonChange,
}: {
  lat: number;
  lon: number;
  km: number;
  mode?: "radius" | "polygon";
  polygon?: LatLng[];
  onPolygonChange?: (pts: LatLng[]) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const circleRef = useRef<LCircle | null>(null);
  const polyRef = useRef<LPolygon | null>(null);
  const vertexRef = useRef<LayerGroup | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [pts, setPts] = useState<LatLng[]>(polygon ?? []);
  const ptsRef = useRef<LatLng[]>(pts);
  ptsRef.current = pts;

  // Inicializar el mapa una vez (por sucursal).
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !divRef.current || mapRef.current) return;
      const L = mod.default;
      LRef.current = L;
      const map = L.map(divRef.current, { scrollWheelZoom: false }).setView([lat, lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
      L.circleMarker([lat, lon], { radius: 6, color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 1, weight: 2 }).addTo(map);
      vertexRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Tocar el mapa agrega un vértice (solo en modo polígono).
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        if (modeRef.current !== "polygon") return;
        const next: LatLng[] = [...ptsRef.current, [e.latlng.lat, e.latlng.lng]];
        setPts(next);
        onPolygonChange?.(next);
      });
      setTimeout(() => map.invalidateSize(), 120);
      draw();
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; circleRef.current = null; polyRef.current = null; vertexRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);

  // Redibujar círculo / polígono cuando cambian el radio, el modo o los puntos.
  function draw() {
    const L = LRef.current, map = mapRef.current, vg = vertexRef.current;
    if (!L || !map) return;

    if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
    if (polyRef.current) { polyRef.current.remove(); polyRef.current = null; }
    vg?.clearLayers();

    if (mode === "radius") {
      const c = L.circle([lat, lon], { radius: km * 1000, color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.12, weight: 2 }).addTo(map);
      circleRef.current = c;
      if (km > 0) map.fitBounds(c.getBounds(), { padding: [20, 20] });
    } else if (pts.length) {
      if (pts.length >= 3) {
        const p = L.polygon(pts, { color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.15, weight: 2 }).addTo(map);
        polyRef.current = p;
        map.fitBounds(p.getBounds(), { padding: [30, 30] });
      } else if (pts.length === 2) {
        L.polyline(pts, { color: "#4f46e5", weight: 2, dashArray: "4" }).addTo(vg);
      }
      pts.forEach(([la, lo]) => L.circleMarker([la, lo], { radius: 5, color: "#4f46e5", fillColor: "#fff", fillOpacity: 1, weight: 2 }).addTo(vg));
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(draw, [pts, km, mode, lat, lon]);

  function undo() { const n = pts.slice(0, -1); setPts(n); onPolygonChange?.(n); }
  function clear() { setPts([]); onPolygonChange?.([]); }

  return (
    <div className="relative">
      <div ref={divRef} className="h-72 w-full overflow-hidden rounded-xl ring-1 ring-black/10" style={{ zIndex: 0 }} />
      {mode === "polygon" && (
        <>
          <div className="absolute left-2 top-2 z-[500] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow ring-1 ring-black/5">
            {pts.length < 3 ? "🖊️ Tocá el mapa para marcar los límites de tu zona" : `Zona con ${pts.length} puntos`}
          </div>
          <div className="absolute right-2 top-2 z-[500] flex gap-1.5">
            <button type="button" onClick={undo} disabled={!pts.length} className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow ring-1 ring-black/5 disabled:opacity-40">Deshacer</button>
            <button type="button" onClick={clear} disabled={!pts.length} className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-red-600 shadow ring-1 ring-black/5 disabled:opacity-40">Limpiar</button>
          </div>
        </>
      )}
    </div>
  );
}
