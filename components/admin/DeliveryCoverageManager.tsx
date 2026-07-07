"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Branch, DeliveryBand } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type BandRow = { max_km: string; cost: string; min_order: string };

export default function DeliveryCoverageManager({ currency = "$", base = "" }: { currency?: string; base?: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bandsByBranch, setBandsByBranch] = useState<Record<number, BandRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const [brs, bands] = await Promise.all([
      fetch("/api/branches").then((r) => r.json()) as Promise<Branch[]>,
      fetch("/api/delivery-bands").then((r) => r.json()) as Promise<DeliveryBand[]>,
    ]);
    const map: Record<number, BandRow[]> = {};
    for (const br of brs) map[br.id] = [];
    for (const b of bands) {
      (map[b.branch_id] ??= []).push({ max_km: String(b.max_km), cost: String(b.cost), min_order: String(b.min_order || "") });
    }
    setBranches(brs.filter((b) => b.active));
    setBandsByBranch(map);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function setRows(branchId: number, rows: BandRow[]) {
    setBandsByBranch((m) => ({ ...m, [branchId]: rows }));
    setSavedId(null);
  }
  function addRow(branchId: number) {
    setRows(branchId, [...(bandsByBranch[branchId] ?? []), { max_km: "", cost: "", min_order: "" }]);
  }
  function removeRow(branchId: number, i: number) {
    setRows(branchId, (bandsByBranch[branchId] ?? []).filter((_, idx) => idx !== i));
  }
  function editRow(branchId: number, i: number, patch: Partial<BandRow>) {
    setRows(branchId, (bandsByBranch[branchId] ?? []).map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function save(branchId: number) {
    setSavingId(branchId);
    await fetch("/api/delivery-bands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branch_id: branchId,
        bands: (bandsByBranch[branchId] ?? []).map((r) => ({ max_km: Number(r.max_km) || 0, cost: Number(r.cost) || 0, min_order: Number(r.min_order) || 0 })),
      }),
    });
    setSavingId(null);
    setSavedId(branchId);
  }

  if (loading) return <p className="py-12 text-center text-neutral-400">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Delivery por zona de cobertura</h1>
        <p className="text-neutral-500">
          Cada sucursal reparte dentro de un radio. Definí franjas por distancia y su costo. Si el cliente está más lejos
          que la franja mayor, <b>no se le ofrece envío</b> (solo retiro).
        </p>
      </div>

      {branches.map((br) => {
        const located = br.lat != null && br.lon != null;
        const rows = bandsByBranch[br.id] ?? [];
        const maxKm = Math.max(0, ...rows.map((r) => Number(r.max_km) || 0));
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
              <>
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-neutral-400">
                    <span>Hasta (km)</span><span>Costo ({currency})</span><span>Pedido mín. ({currency})</span><span></span>
                  </div>
                  {rows.map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                      <input type="number" value={r.max_km} onChange={(e) => editRow(br.id, i, { max_km: e.target.value })} placeholder="3" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                      <input type="number" value={r.cost} onChange={(e) => editRow(br.id, i, { cost: e.target.value })} placeholder="800" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                      <input type="number" value={r.min_order} onChange={(e) => editRow(br.id, i, { min_order: e.target.value })} placeholder="0" className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                      <button onClick={() => removeRow(br.id, i)} className="px-2 text-red-400 hover:text-red-600" aria-label="Quitar">✕</button>
                    </div>
                  ))}
                  {rows.length === 0 && <p className="text-sm text-neutral-400">Sin franjas: esta sucursal no hace delivery (solo retiro).</p>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => addRow(br.id)} className="text-sm font-semibold text-[var(--brand)] hover:underline">+ Agregar franja</button>
                  {maxKm > 0 && <span className="text-xs text-neutral-400">Cobertura máx: {maxKm} km</span>}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button onClick={() => save(br.id)} disabled={savingId === br.id} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
                    {savingId === br.id ? "Guardando…" : "Guardar cobertura"}
                  </button>
                  {savedId === br.id && <span className="text-sm font-medium text-green-600">✅ Guardado</span>}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
