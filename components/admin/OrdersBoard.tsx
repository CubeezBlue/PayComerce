"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Branch } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type OrderItem = { name: string; qty: number; price: number };
type Order = {
  id: number;
  code: string;
  branch_id: number | null;
  customer_name: string;
  phone: string;
  address: string;
  delivery: string;
  payment: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  invoice: number;
  cuit: string;
  status: string;
  payment_status: string;
  mp_payment_id: string;
  cae: string;
  cae_vto: string;
  invoice_number: string;
  invoice_type: string;
  invoice_demo: number;
  created_at: string;
};

const PAY_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: "Pagado ✓", cls: "bg-green-100 text-green-700" },
  pending: { label: "Pago pendiente", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Pago rechazado", cls: "bg-red-100 text-red-600" },
};

const COLUMNS = [
  { key: "nuevo", label: "Nuevos", icon: "🆕", accent: "bg-blue-500" },
  { key: "preparacion", label: "En preparación", icon: "👨‍🍳", accent: "bg-amber-500" },
  { key: "listo", label: "Listos", icon: "✅", accent: "bg-green-500" },
];

const NEXT: Record<string, string> = { nuevo: "preparacion", preparacion: "listo", listo: "entregado" };
const NEXT_LABEL: Record<string, string> = { nuevo: "A preparación", preparacion: "Marcar listo", listo: "Marcar entregado ✓" };
const PREV: Record<string, string> = { preparacion: "nuevo", listo: "preparacion", entregado: "listo" };

const PAY_LABEL: Record<string, string> = { online: "💳 Pagado online", cash: "💵 Efectivo", transfer: "🏦 Transferencia" };

function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

export default function OrdersBoard({ branches }: { branches: Branch[] }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchFilter, setBranchFilter] = useState<number | "all">("all");
  const [view, setView] = useState<"activos" | "historial">("activos");
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [now, setNow] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const maxIdRef = useRef(0);
  const multiBranch = branches.length > 1;
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  function beep() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      o.start();
      o.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      o.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  const refresh = useCallback(async () => {
    const q = branchFilter === "all" ? "" : `?branch=${branchFilter}`;
    const data: Order[] = await fetch(`/api/orders${q}`).then((r) => r.json());
    setOrders(data);
    setLoaded(true);
    setNow(Date.now());
  }, [branchFilter]);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 5000);
    const clock = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [refresh]);

  const newCount = orders.filter((o) => o.status === "nuevo").length;

  // Sonido cuando entra un pedido con id mayor al último visto
  useEffect(() => {
    if (orders.length === 0) return;
    const maxId = Math.max(...orders.map((o) => o.id));
    if (maxIdRef.current === 0) { maxIdRef.current = maxId; return; } // primera carga: no suena
    if (maxId > maxIdRef.current) {
      if (soundOn) beep();
      maxIdRef.current = maxId;
    }
  }, [orders, soundOn]);

  function printTicket(o: Order) {
    const lines = o.items.map((it) => `${it.qty} x ${it.name}`).join("<br>");
    const pay = PAY_LABEL[o.payment] ?? o.payment;
    const html = `<html><head><meta charset="utf-8"><title>${o.code}</title>
      <style>body{font-family:monospace;width:280px;margin:0;padding:10px;font-size:13px}h1{font-size:16px;text-align:center;margin:0 0 6px}hr{border:none;border-top:1px dashed #000;margin:8px 0}.r{display:flex;justify-content:space-between}.b{font-weight:bold}</style>
      </head><body>
      <h1>${(o.customer_name && "") || ""}COMANDA</h1>
      <div style="text-align:center">Pedido ${o.code}</div>
      ${multiBranch && o.branch_id ? `<div style="text-align:center">${branchName.get(o.branch_id) ?? ""}</div>` : ""}
      <hr>
      ${lines}
      <hr>
      <div class="r b"><span>TOTAL</span><span>${formatPrice(o.total)}</span></div>
      <hr>
      <div>Cliente: ${o.customer_name}</div>
      <div>${o.delivery === "delivery" ? "Delivery: " + o.address : "Retiro en local"}</div>
      <div>Pago: ${pay}</div>
      ${o.notes ? `<div>Notas: ${o.notes}</div>` : ""}
      </body></html>`;
    const w = window.open("", "_blank", "width=340,height=600");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }

  async function setStatus(id: number, status: string) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  async function doCancel(id: number) {
    setCancelTarget(null);
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "cancelado" } : o)));
    await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
    refresh();
  }

  async function setPayment(id: number, payment_status: string) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, payment_status } : o)));
    await fetch(`/api/orders/${id}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status }),
    });
    refresh();
  }

  const [invoicing, setInvoicing] = useState<number | null>(null);
  async function generateInvoice(id: number) {
    setInvoicing(id);
    const res = await fetch(`/api/orders/${id}/invoice`, { method: "POST" });
    setInvoicing(null);
    if (!res.ok) { alert((await res.json()).error || "No se pudo facturar"); return; }
    refresh();
  }

  async function deleteOrder(id: number) {
    if (!confirm("¿Borrar este pedido del historial? No se puede deshacer.")) return;
    setOrders((os) => os.filter((o) => o.id !== id));
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    refresh();
  }

  async function clearHistory() {
    if (!confirm("¿Vaciar todo el historial (entregados y cancelados)?")) return;
    await fetch(`/api/orders`, { method: "DELETE" });
    refresh();
  }

  const byStatus = (s: string) => orders.filter((o) => o.status === s);
  const finalized = orders.filter((o) => o.status === "entregado" || o.status === "cancelado");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-neutral-500">
            {loaded ? `${newCount} nuevo(s) · se actualiza solo` : "Cargando…"}
          </p>
        </div>
        <button
          onClick={() => { const next = !soundOn; setSoundOn(next); if (next) beep(); }}
          className={`self-start rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${soundOn ? "bg-[var(--brand)]/10 text-[var(--brand)] ring-[var(--brand)]/30" : "bg-white text-neutral-500 ring-black/10"}`}
          title="Aviso sonoro al entrar un pedido"
        >
          {soundOn ? "🔔 Sonido activado" : "🔕 Activar sonido"}
        </button>
        {multiBranch && (
          <div className="flex flex-wrap items-center gap-2">
            <Chip active={branchFilter === "all"} onClick={() => setBranchFilter("all")}>Todas</Chip>
            {branches.map((b) => (
              <Chip key={b.id} active={branchFilter === b.id} onClick={() => setBranchFilter(b.id)}>📍 {b.name}</Chip>
            ))}
          </div>
        )}
      </div>

      {/* Toggle En curso / Historial */}
      <div className="flex gap-2 border-b border-neutral-200">
        <Tab active={view === "activos"} onClick={() => setView("activos")}>
          En curso <Badge>{orders.filter((o) => o.status !== "entregado" && o.status !== "cancelado").length}</Badge>
        </Tab>
        <Tab active={view === "historial"} onClick={() => setView("historial")}>
          Historial <Badge>{finalized.length}</Badge>
        </Tab>
      </div>

      {view === "historial" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">Pedidos entregados y cancelados.</p>
            {finalized.length > 0 && (
              <button onClick={clearHistory} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50">
                🗑 Vaciar historial
              </button>
            )}
          </div>
          <div className="space-y-2">
            {finalized.length === 0 && <p className="py-12 text-center text-neutral-400">Todavía no hay pedidos finalizados.</p>}
            {finalized.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-black/5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.status === "entregado" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {o.status === "entregado" ? "Entregado" : "Cancelado"}
                </span>
                <span className="font-bold">{o.code}</span>
                <span className="text-neutral-500">{o.customer_name}</span>
                <span className="text-neutral-400">{o.items.reduce((s, it) => s + it.qty, 0)} ítems</span>
                {multiBranch && o.branch_id && <span className="text-neutral-400">📍 {branchName.get(o.branch_id)}</span>}
                <span className="text-neutral-400">{timeAgo(o.created_at, now)}</span>
                <span className="ml-auto font-bold">{formatPrice(o.total)}</span>
                {o.status === "entregado" && (
                  <button onClick={() => setStatus(o.id, "listo")} className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-50">
                    ↩ Reabrir
                  </button>
                )}
                <button onClick={() => deleteOrder(o.id)} className="grid h-7 w-7 place-items-center rounded-full text-red-500 hover:bg-red-50" title="Borrar">🗑</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = byStatus(col.key);
          return (
            <div key={col.key} className="flex flex-col rounded-2xl bg-neutral-100/70 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.accent}`} /> {col.icon} {col.label}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-neutral-500">{list.length}</span>
              </div>

              <div className="flex-1 space-y-3">
                {list.length === 0 && <p className="px-1 py-6 text-center text-xs text-neutral-400">Sin pedidos.</p>}
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-black/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{o.code}</p>
                        <p className="text-xs text-neutral-400">{timeAgo(o.created_at, now)}</p>
                      </div>
                      <span className="font-bold">{formatPrice(o.total)}</span>
                    </div>

                    <div className="mt-2 space-y-0.5 text-xs text-neutral-600">
                      {o.items.map((it, i) => (
                        <div key={i}>{it.qty}× {it.name}</div>
                      ))}
                    </div>

                    <div className="mt-2 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
                      <p className="font-medium text-neutral-700">{o.customer_name}</p>
                      <p>{o.delivery === "delivery" ? `🛵 ${o.address}` : "🏬 Retiro en local"}</p>
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span>{PAY_LABEL[o.payment] ?? o.payment}</span>
                        {(o.payment === "online" || o.payment === "transfer") && PAY_BADGE[o.payment_status] && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PAY_BADGE[o.payment_status].cls}`}>
                            {PAY_BADGE[o.payment_status].label}
                          </span>
                        )}
                      </p>
                      {o.payment === "transfer" && (
                        <button
                          onClick={() => setPayment(o.id, o.payment_status === "approved" ? "pending" : "approved")}
                          className={`mt-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            o.payment_status === "approved"
                              ? "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {o.payment_status === "approved" ? "↩ Marcar como no pagado" : "✓ Marcar transferencia recibida"}
                        </button>
                      )}

                      {/* Factura */}
                      {o.invoice === 1 && (
                        <div className="mt-2 rounded-lg bg-neutral-50 p-2 text-[11px] ring-1 ring-black/5">
                          {o.cae ? (
                            <div className="text-neutral-600">
                              <span className="font-semibold">🧾 Factura {o.invoice_type} {o.invoice_number}</span>
                              {o.invoice_demo === 1 && <span className="ml-1 rounded bg-amber-100 px-1 text-amber-700">demo</span>}
                              <div className="text-neutral-400">CAE {o.cae} · vto {o.cae_vto}</div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-neutral-500">🧾 Factura pendiente</span>
                              <button
                                onClick={() => generateInvoice(o.id)}
                                disabled={invoicing === o.id}
                                className="rounded-full bg-[var(--brand)] px-2.5 py-1 font-semibold text-[var(--brand-text)] disabled:opacity-60"
                              >
                                {invoicing === o.id ? "Generando…" : "Generar factura"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {multiBranch && o.branch_id && <p>📍 {branchName.get(o.branch_id)}</p>}
                      {o.notes && <p className="mt-1 italic">“{o.notes}”</p>}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {PREV[o.status] && (
                        <button
                          onClick={() => setStatus(o.id, PREV[o.status])}
                          className="rounded-full border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:bg-neutral-50"
                          title="Volver atrás"
                        >
                          ←
                        </button>
                      )}
                      {NEXT[o.status] && (
                        <button
                          onClick={() => setStatus(o.id, NEXT[o.status])}
                          className="flex-1 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-text)] shadow-sm"
                        >
                          {NEXT_LABEL[o.status]}
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${o.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        className="grid h-8 w-8 place-items-center rounded-full bg-green-500 text-white"
                        title="WhatsApp al cliente"
                      >
                        💬
                      </a>
                      <button
                        onClick={() => printTicket(o)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-neutral-800 text-white"
                        title="Imprimir comanda"
                      >
                        🖨
                      </button>
                    </div>
                    <button
                      onClick={() => setCancelTarget(o)}
                      className="mt-2 w-full rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Cancelar pedido
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Confirmación de cancelación */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCancelTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-2xl">⚠️</div>
            <h2 className="mt-3 text-lg font-bold">¿Estás seguro que querés cancelar este pedido?</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Pedido <b>{cancelTarget.code}</b> de {cancelTarget.customer_name}. Se repone el stock descontado. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setCancelTarget(null)} className="flex-1 rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">
                No, volver
              </button>
              <button onClick={() => doCancel(cancelTarget.id)} className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600">
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold transition ${
        active ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-neutral-500 hover:text-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-bold text-neutral-500">{children}</span>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm" : "bg-white text-neutral-600 ring-1 ring-black/5 hover:ring-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}
