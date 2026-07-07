"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

export type OwnerStoreRow = {
  slug: string;
  name: string;
  created_at: string;
  email: string | null;
  plan: string;
  addons: string[];
  products: number;
  orders: number;
  revenue: number;
  lastOrder: string | null;
  mpConfigured: boolean;
  paused: boolean;
};

const PLAN_LABEL: Record<string, string> = { emprendedor: "Emprendedor", profesional: "Profesional", empresa: "Empresa" };

export default function OwnerStores({ stores }: { stores: OwnerStoreRow[] }) {
  const [busy, setBusy] = useState<string>("");

  async function togglePause(s: OwnerStoreRow) {
    setBusy(s.slug);
    await fetch(`/api/owner/stores/${s.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !s.paused }),
    });
    window.location.reload();
  }

  async function remove(s: OwnerStoreRow) {
    if (s.slug === "demo") return;
    if (!confirm(`¿Eliminar DEFINITIVAMENTE la tienda "${s.name}" (/t/${s.slug})?\n\nSe borran todos sus productos, pedidos y datos. Esta acción NO se puede deshacer.`)) return;
    if (!confirm("Confirmá una vez más: esta acción es irreversible.")) return;
    setBusy(s.slug);
    const res = await fetch(`/api/owner/stores/${s.slug}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "No se pudo eliminar"); setBusy(""); return; }
    window.location.reload();
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3 text-right">Prod.</th>
              <th className="px-4 py-3 text-right">Pedidos</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
              <th className="px-4 py-3">Últ. pedido</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {stores.map((s) => (
              <tr key={s.slug} className={`hover:bg-neutral-50 ${busy === s.slug ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-neutral-400">/t/{s.slug}</p>
                  {s.email && <p className="text-xs text-neutral-400">{s.email}</p>}
                </td>
                <td className="px-4 py-3">
                  {s.paused ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pausada</span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Activa</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[#4f46e5]/10 px-2 py-0.5 text-xs font-semibold text-[#4f46e5]">{PLAN_LABEL[s.plan] ?? s.plan}</span>
                  {s.addons.length > 0 && <span className="ml-1 text-xs text-neutral-400">+{s.addons.length}</span>}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{s.products}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.orders}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(s.revenue)}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{s.lastOrder ? s.lastOrder.slice(0, 10) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a href={`/t/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-[#4f46e5] hover:underline">Ver</a>
                    <button onClick={() => togglePause(s)} disabled={busy === s.slug} className="text-amber-600 hover:underline">
                      {s.paused ? "Reactivar" : "Pausar"}
                    </button>
                    {s.slug !== "demo" && (
                      <button onClick={() => remove(s)} disabled={busy === s.slug} className="text-red-500 hover:underline">Eliminar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
