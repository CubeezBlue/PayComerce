"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; lat: string; lon: string };

// Campo de dirección con autocompletado (OpenStreetMap). El cliente elige su
// dirección exacta de una lista, como en Google Maps.
export default function AddressAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = "Dirección de entrega",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick?: (p: { label: string; lat: number; lon: number }) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<Suggestion | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value]);

  // Cerrar al clickear afuera
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(s: Suggestion) {
    skipNext.current = true; // no re-disparar la búsqueda al setear el valor
    onChange(s.label);
    setChosen(s);
    setOpen(false);
    onPick?.({ label: s.label, lat: Number(s.lat), lon: Number(s.lon) });
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setChosen(null); }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
      />
      {loading && <span className="absolute right-3 top-3.5 text-xs text-neutral-400">buscando…</span>}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
              >
                <span className="mt-0.5 text-[var(--brand)]">📍</span>
                <span className="text-neutral-700">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <p className="mt-1 flex items-center gap-1 text-xs text-green-600">✓ Dirección seleccionada del mapa</p>
      )}
    </div>
  );
}
