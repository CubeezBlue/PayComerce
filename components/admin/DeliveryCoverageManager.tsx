"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Branch, DeliveryBand } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import CoverageMapPicker from "./CoverageMapPicker";

type Cfg = { km: number; cost: string; min_order: string };

export default function DeliveryCoverageManager({ currency = "$", base = "" }: { currency?: string; base?: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cfg, setCfg] = useState<Record<number, Cfg>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [brs, bands] = await Promise.all([
      fetch("/api/branches").then((r) => r.json()) as Promise<Branch[]>,
      fetch("/api/delivery-bands").then((r) => r.json()) as Promise<DeliveryBand[]>,
    ]);
    const map: Record<number, Cfg> = {};
    for (const br of brs) map[br.id] = { km: 3, cost: "", min_order: "" };
    // Colapsamos a un solo radio por sucursal (el mayor, si había varias franjas).
    for (const b of bands) {
      const cur = map[b.branch_id];
      if (cur && b.max_km >= cur.km) map[b.branch_id] = { km: b.max_km, cost: String(b.cost || ""), min_order: String(b.min_order || "") };
    }
    setBranches(brs.filter((b) => b.active));
    setCfg(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function patch(id: number, p: Partial<Cfg>) {
    setCfg((m) => ({ ...m, [id]: { ...m[id], ...p } }));
    setSavedId(null);
  }

  async function save(id: number) {
    setSavingId(id);
    const c = cfg[id];
    await fetch("/api/delivery-bands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: id, bands: [{ max_km: c.km, cost: Number(c.cost) || 0, min_order: Number(c.min_order) || 0 }] }),
    });
    setSavingId(null);
    setSavedId(id);
  }

  async function disable(id: number) {
    setSavingId(id);
    await fetch("/api/delivery-bands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ branch_id: id, bands: [] }),
    });
    setSavingId(null);
    patch(id, { cost: "" });
    setSavedId(id);
  }

  if (loading) return <p className="py-12 text-center text-neutral-400">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery por zona de cobertura</h1>
        <p className="text-neutral-500">
          Cada sucursal reparte dentro de un radio. Arrastrá el slider para marcar el área en el mapa. Si el cliente está
          fuera del círculo, <b>no se le ofrece envío</b> (solo retiro).
        </p>
      </div>

      {branches.map((br) => {
        const located = br.lat != null && br.lon != null;
        const c = cfg[br.id];
        return (
          <div key={br.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">📍 {br.name}</h2>
                <p className="text-xs text-neutral-400">{br.address || "Sin dirección"}</p>
              </div>
              {located ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Ubicada</span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Sin ubicar</span>
              )}
            </div>

            {!located ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
                Para el delivery por radio necesitás fijar la ubicación de esta sucursal. Andá a{" "}
                <Link href={`${base}/admin/sucursales`} className="font-semibold underline">Sucursales</Link>, editá la
                sucursal y elegí su dirección del mapa.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <CoverageMapPicker lat={br.lat as number} lon={br.lon as number} km={c.km} />

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-neutral-700">Radio de cobertura</label>
                    <span className="text-sm font-bold text-[var(--brand)]">{c.km} km</span>
                  </div>
                  <input
                    type="range" min={0.5} max={20} step={0.5} value={c.km}
                    onChange={(e) => patch(br.id, { km: Number(e.target.value) })}
                    className="mt-2 w-full accent-[var(--brand)]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Costo de envío ({currency})</span>
                    <input type="number" value={c.cost} onChange={(e) => patch(br.id, { cost: e.target.value })} placeholder="0 = gratis"
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-700">Pedido mínimo ({currency}, opcional)</span>
                    <input type="number" value={c.min_order} onChange={(e) => patch(br.id, { min_order: e.target.value })} placeholder="0 = sin mínimo"
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => save(br.id)} disabled={savingId === br.id} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
                    {savingId === br.id ? "Guardando…" : "Guardar cobertura"}
                  </button>
                  <button onClick={() => disable(br.id)} disabled={savingId === br.id} className="text-sm text-neutral-500 hover:underline">
                    Sin delivery en esta sucursal
                  </button>
                  {savedId === br.id && <span className="text-sm font-medium text-green-600">✅ Guardado</span>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
