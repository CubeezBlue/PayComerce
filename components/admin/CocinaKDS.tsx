"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Item = { id: number; name: string; qty: number; notes: string };
type Ticket = { id: number; source: string; ref: string; table_id: number | null; waiter: string; status: string; prep_minutes: number; notes: string; created_at: string; ready_at: string | null; items: Item[] };

const COLS: { status: string; title: string; next: string; nextLabel: string; accent: string }[] = [
  { status: "pendiente", title: "🆕 Nuevas", next: "preparando", nextLabel: "Empezar", accent: "border-t-neutral-400" },
  { status: "preparando", title: "🔥 En preparación", next: "listo", nextLabel: "Marcar lista", accent: "border-t-amber-500" },
  { status: "listo", title: "✅ Listas para entregar", next: "entregado", nextLabel: "Entregada", accent: "border-t-green-500" },
];

export default function CocinaKDS({ prepDefault, canConfig }: { prepDefault: number; canConfig: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [prep, setPrep] = useState(prepDefault);
  const [now, setNow] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [savedPrep, setSavedPrep] = useState(false);

  const soundRef = useRef(soundOn); soundRef.current = soundOn;
  const seen = useRef<Set<number>>(new Set());
  const firstLoad = useRef(true);
  const audioCtx = useRef<AudioContext | null>(null);

  function beep() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = (audioCtx.current ??= new Ctx());
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.12;
      o.start(); o.stop(ctx.currentTime + 0.28);
    } catch { /* audio no disponible */ }
  }

  const load = useCallback(async () => {
    const r = await fetch("/api/cocina").then((x) => x.json()).catch(() => null);
    if (!r?.tickets) return;
    const ts = r.tickets as Ticket[];
    const hasNew = ts.some((t) => t.status === "pendiente" && !seen.current.has(t.id));
    ts.forEach((t) => seen.current.add(t.id));
    if (hasNew && soundRef.current && !firstLoad.current) beep();
    firstLoad.current = false;
    setTickets(ts);
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);
  useEffect(() => { setNow(Date.now()); const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  async function advance(t: Ticket, status: string) {
    setTickets((cur) => cur.filter((x) => (status === "entregado" ? x.id !== t.id : true)).map((x) => (x.id === t.id ? { ...x, status } : x)));
    await fetch("/api/cocina", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, status }) });
    load();
  }

  async function savePrep() {
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kds_prep_minutes: String(prep) }) });
    setSavedPrep(true); setTimeout(() => setSavedPrep(false), 2000);
  }

  function elapsed(t: Ticket) {
    const ms = Math.max(0, now - Date.parse(t.created_at));
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    const over = ms > t.prep_minutes * 60000;
    return { label: `${m}:${String(s).padStart(2, "0")}`, over };
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">👨‍🍳 Cocina</h1>
          <p className="text-neutral-500">Las comandas de las mesas y los pedidos web aparecen acá en tiempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setSoundOn((v) => { const nv = !v; if (nv) beep(); return nv; })} className={`rounded-full px-4 py-2 text-sm font-semibold ${soundOn ? "bg-[var(--brand)] text-[var(--brand-text)]" : "border border-neutral-200 text-neutral-500"}`}>
            {soundOn ? "🔊 Sonido activo" : "🔇 Sonido apagado"}
          </button>
          {canConfig && (
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-sm">
              <span className="text-neutral-500">Tiempo objetivo</span>
              <input type="number" value={prep} onChange={(e) => setPrep(Number(e.target.value) || 0)} className="w-14 rounded-lg border border-neutral-200 px-2 py-1 text-center outline-none focus:border-[var(--brand)]" />
              <span className="text-neutral-500">min</span>
              <button onClick={savePrep} className="font-semibold text-[var(--brand)]">{savedPrep ? "✓" : "Guardar"}</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((col) => {
          const list = tickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <h2 className="flex items-center justify-between text-sm font-bold text-neutral-600">
                <span>{col.title}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">{list.length}</span>
              </h2>
              {list.length === 0 && <p className="rounded-xl border border-dashed border-neutral-200 py-8 text-center text-xs text-neutral-300">Sin comandas</p>}
              {list.map((t) => {
                const e = elapsed(t);
                return (
                  <div key={t.id} className={`rounded-2xl border-t-4 bg-white p-4 shadow-sm ring-1 ring-black/5 ${col.accent} ${col.status !== "listo" && e.over ? "ring-2 ring-red-300" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{t.ref}</p>
                        {t.waiter && <p className="text-xs text-neutral-400">Mesero: {t.waiter}</p>}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${e.over && col.status !== "listo" ? "bg-red-100 text-red-600" : "bg-neutral-100 text-neutral-500"}`}>⏱ {e.label}</span>
                    </div>
                    <ul className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
                      {t.items.map((it) => (
                        <li key={it.id} className="flex gap-2">
                          <span className="font-bold text-[var(--brand)]">{it.qty}×</span>
                          <span>{it.name}{it.notes ? <span className="text-neutral-400"> · {it.notes}</span> : null}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => advance(t, col.next)} className={`mt-3 w-full rounded-xl py-2 text-sm font-semibold shadow-sm ${col.status === "listo" ? "bg-green-600 text-white" : "bg-[var(--brand)] text-[var(--brand-text)]"}`}>
                      {col.nextLabel} →
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
