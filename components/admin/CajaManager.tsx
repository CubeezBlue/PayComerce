"use client";

import { useCallback, useEffect, useState } from "react";
import { Branch } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type MethodTotals = { count: number; amount: number };
type Report = {
  day: string;
  branchId: number | null;
  totalSales: number;
  ordersCount: number;
  cancelledCount: number;
  byMethod: { cash: MethodTotals; transfer: MethodTotals; online: MethodTotals };
};
type Closure = {
  id: number; branch_id: number | null; day: string; opening: number; counted_cash: number;
  expected_cash: number; total_sales: number; by_method: string; notes: string; created_at: string;
};

const todayArg = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

const METHODS: { key: "cash" | "transfer" | "online"; label: string; icon: string }[] = [
  { key: "cash", label: "Efectivo", icon: "💵" },
  { key: "transfer", label: "Transferencia", icon: "🏦" },
  { key: "online", label: "Mercado Pago", icon: "💳" },
];

export default function CajaManager({ currency = "$", branches }: { currency?: string; branches: Branch[] }) {
  const [day, setDay] = useState(todayArg());
  const [branch, setBranch] = useState<string>("all");
  const [report, setReport] = useState<Report | null>(null);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);

  const [opening, setOpening] = useState("");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const money = (n: number) => formatPrice(n, currency);
  const branchName = (id: number | null) => (id == null ? "Todas" : branches.find((b) => b.id === id)?.name || `#${id}`);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/caja?day=${day}&branch=${branch}`).then((x) => x.json());
    setReport(r.report);
    setClosures(r.closures);
    setLoading(false);
  }, [day, branch]);
  useEffect(() => { load(); }, [load]);

  const cashSales = report?.byMethod.cash.amount ?? 0;
  const expected = (Number(opening) || 0) + cashSales;
  const diff = counted === "" ? null : (Number(counted) || 0) - expected;

  async function saveClosure() {
    setSaving(true);
    await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, branch_id: branch === "all" ? null : Number(branch), opening: Number(opening) || 0, counted_cash: Number(counted) || 0, notes }),
    });
    setSaving(false);
    setSaved(true);
    setOpening(""); setCounted(""); setNotes("");
    load();
    setTimeout(() => setSaved(false), 2500);
  }

  const multiBranch = branches.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">💰 Caja del día</h1>
          <p className="text-neutral-500">Cuánto cobraste por cada medio de pago y el arqueo del efectivo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={day} max={todayArg()} onChange={(e) => setDay(e.target.value)}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
          {multiBranch && (
            <select value={branch} onChange={(e) => setBranch(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
              <option value="all">Todas las sucursales</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {loading || !report ? (
        <p className="py-12 text-center text-neutral-400">Cargando…</p>
      ) : (
        <>
          {/* Resumen */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase text-neutral-400">Total cobrado</p>
              <p className="mt-1 text-2xl font-black text-[var(--brand)]">{money(report.totalSales)}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase text-neutral-400">Pedidos</p>
              <p className="mt-1 text-2xl font-black">{report.ordersCount}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-xs uppercase text-neutral-400">Cancelados</p>
              <p className="mt-1 text-2xl font-black text-neutral-400">{report.cancelledCount}</p>
            </div>
          </div>

          {/* Por medio de pago */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
                  <th className="px-5 py-3">Medio de pago</th>
                  <th className="px-5 py-3 text-right">Pedidos</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {METHODS.map((m) => (
                  <tr key={m.key}>
                    <td className="px-5 py-3 font-medium">{m.icon} {m.label}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{report.byMethod[m.key].count}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{money(report.byMethod[m.key].amount)}</td>
                  </tr>
                ))}
                <tr className="bg-neutral-50 font-bold">
                  <td className="px-5 py-3">Total</td>
                  <td className="px-5 py-3 text-right tabular-nums">{report.ordersCount}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{money(report.totalSales)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Arqueo de efectivo */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-bold">🧮 Arqueo de efectivo</h2>
            <p className="text-sm text-neutral-500">Contá la plata de la caja y comparala con lo que debería haber.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Fondo inicial ({currency})</span>
                <input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Efectivo contado ({currency})</span>
                <input type="number" value={counted} onChange={(e) => setCounted(e.target.value)} placeholder="Lo que hay en la caja"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
              </label>
            </div>
            <div className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Fondo inicial</span><span className="tabular-nums">{money(Number(opening) || 0)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">+ Ventas en efectivo</span><span className="tabular-nums">{money(cashSales)}</span></div>
              <div className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold"><span>Efectivo esperado</span><span className="tabular-nums">{money(expected)}</span></div>
              {diff != null && (
                <div className={`flex justify-between font-bold ${diff === 0 ? "text-green-600" : diff > 0 ? "text-amber-600" : "text-red-600"}`}>
                  <span>{diff === 0 ? "Cuadra ✅" : diff > 0 ? "Sobra" : "Falta"}</span>
                  <span className="tabular-nums">{money(Math.abs(diff))}</span>
                </div>
              )}
            </div>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones (opcional)"
              className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
            <div className="mt-4 flex items-center gap-3">
              <button onClick={saveClosure} disabled={saving}
                className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
                {saving ? "Guardando…" : "Cerrar caja"}
              </button>
              {saved && <span className="text-sm font-medium text-green-600">✅ Cierre guardado</span>}
            </div>
          </div>

          {/* Historial */}
          {closures.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <p className="border-b border-neutral-100 px-5 py-3 text-sm font-bold">Cierres anteriores</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
                      <th className="px-5 py-2.5">Día</th>
                      {multiBranch && <th className="px-5 py-2.5">Sucursal</th>}
                      <th className="px-5 py-2.5 text-right">Esperado</th>
                      <th className="px-5 py-2.5 text-right">Contado</th>
                      <th className="px-5 py-2.5 text-right">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {closures.map((c) => {
                      const d = c.counted_cash - c.expected_cash;
                      return (
                        <tr key={c.id}>
                          <td className="px-5 py-2.5 tabular-nums">{c.day}</td>
                          {multiBranch && <td className="px-5 py-2.5 text-neutral-500">{branchName(c.branch_id)}</td>}
                          <td className="px-5 py-2.5 text-right tabular-nums">{money(c.expected_cash)}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums">{money(c.counted_cash)}</td>
                          <td className={`px-5 py-2.5 text-right font-semibold tabular-nums ${d === 0 ? "text-green-600" : d > 0 ? "text-amber-600" : "text-red-600"}`}>
                            {d === 0 ? "OK" : `${d > 0 ? "+" : "−"}${money(Math.abs(d))}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
