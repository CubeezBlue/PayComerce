"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Rounding = "none" | "ten" | "hundred";

function roundPrice(v: number, r: Rounding) {
  if (r === "ten") return Math.round(v / 10) * 10;
  if (r === "hundred") return Math.round(v / 100) * 100;
  return Math.round(v * 100) / 100;
}

export default function PriceAdjuster() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scope, setScope] = useState<"all" | number>("all");
  const [percent, setPercent] = useState("10");
  const [rounding, setRounding] = useState<Rounding>("ten");
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  async function load() {
    const [p, c] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
  }
  useEffect(() => { load(); }, []);

  const affected = useMemo(
    () => products.filter((p) => scope === "all" || p.category_id === scope),
    [products, scope]
  );

  const pct = Number(percent) || 0;
  const factor = 1 + pct / 100;
  const preview = affected.map((p) => ({ ...p, next: roundPrice(p.price * factor, rounding) }));

  async function apply() {
    if (pct === 0) return;
    if (!confirm(`Vas a ${pct > 0 ? "aumentar" : "reducir"} ${Math.abs(pct)}% a ${affected.length} producto(s). ¿Confirmás?`)) return;
    setApplying(true);
    setDone(null);
    const res = await fetch("/api/products/adjust-prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: pct, categoryId: scope === "all" ? null : scope, rounding }),
    });
    setApplying(false);
    if (res.ok) {
      const data = await res.json();
      setDone(data.updated);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ajuste de precios</h1>
        <p className="text-neutral-500">Aumentá o reducí precios por porcentaje, global o por categoría. Ideal para la inflación.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <span className="text-sm font-medium text-neutral-700">Alcance</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="all">Toda la tienda</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <span className="text-sm font-medium text-neutral-700">Porcentaje (%)</span>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setPercent(String((Number(percent) || 0) - 5))} className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 font-bold">−</button>
            <input
              type="number"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-center text-sm outline-none focus:border-[var(--brand)]"
            />
            <button onClick={() => setPercent(String((Number(percent) || 0) + 5))} className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 font-bold">+</button>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Usá negativo para descuento.</p>
        </label>

        <label className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <span className="text-sm font-medium text-neutral-700">Redondeo</span>
          <select
            value={rounding}
            onChange={(e) => setRounding(e.target.value as Rounding)}
            className="mt-2 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          >
            <option value="none">Sin redondeo</option>
            <option value="ten">Al múltiplo de $10</option>
            <option value="hundred">Al múltiplo de $100</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-[var(--brand)]/10 px-5 py-4">
        <p className="text-sm text-neutral-700">
          Se ajustarán <b>{affected.length}</b> producto(s) en <b>{pct > 0 ? "+" : ""}{pct}%</b>.
        </p>
        <button
          onClick={apply}
          disabled={applying || pct === 0 || affected.length === 0}
          className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-50"
        >
          {applying ? "Aplicando…" : "Aplicar cambios"}
        </button>
      </div>

      {done !== null && (
        <div className="rounded-2xl bg-green-50 px-5 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          ✅ Listo: se actualizaron {done} precio(s).
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Precio actual</th>
              <th className="px-4 py-3 text-right">Precio nuevo</th>
              <th className="px-4 py-3 text-right">Δ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {preview.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-right text-neutral-500">{formatPrice(p.price)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[var(--brand)]">{formatPrice(p.next)}</td>
                <td className={`px-4 py-2.5 text-right text-xs ${p.next >= p.price ? "text-green-600" : "text-red-500"}`}>
                  {p.next >= p.price ? "+" : ""}{formatPrice(p.next - p.price)}
                </td>
              </tr>
            ))}
            {preview.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-400">Sin productos en este alcance.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
