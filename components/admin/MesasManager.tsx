"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

type Room = { id: number; name: string; position: number };
type TableT = { id: number; room_id: number | null; name: string; seats: number; pos_x: number; pos_y: number; active: number; position: number; cart_id: number | null; waiter: string; opened_at: string | null; items: number; total: number; ready: number };
type CartItem = { id: number; cart_id: number; product_id: number | null; name: string; qty: number; price: number };
type Stat = { table_id: number; name: string; orders: number; total: number };
type Product = { id: number; name: string; price: number; category_id: number | null };

const PAYMENTS = [
  { key: "cash", label: "Efectivo", icon: "💵" },
  { key: "transfer", label: "Transferencia", icon: "🏦" },
  { key: "online", label: "Mercado Pago", icon: "💳" },
];

export default function MesasManager({ currency = "$", products, canConfig, hasCocina = false }: { currency?: string; products: Product[]; canConfig: boolean; hasCocina?: boolean }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<TableT[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [room, setRoom] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);

  const [sel, setSel] = useState<TableT | null>(null); // mesa abierta en el panel de cuenta
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<number | null>(null);
  const [waiter, setWaiter] = useState("");
  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const money = (n: number) => formatPrice(n, currency);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/mesas${room != null ? `?room=${room}` : ""}`).then((x) => x.json());
    setRooms(r.rooms || []);
    setTables(r.tables || []);
    setStats(r.stats || []);
    if (room == null && r.rooms?.length) setRoom(r.rooms[0].id);
    setLoading(false);
  }, [room]);
  useEffect(() => { reload(); }, [reload]);

  const shownTables = tables.filter((t) => room == null || t.room_id === room);

  async function loadCart(t: TableT) {
    const r = await fetch(`/api/mesas/cart?table=${t.id}`).then((x) => x.json());
    setCartId(r.cart?.id ?? null);
    setWaiter(r.cart?.waiter ?? "");
    setItems(r.items || []);
  }
  function openTable(t: TableT) {
    if (edit) return;
    setSel(t); setSearch(""); setMoving(false);
    loadCart(t);
  }
  function closePanel() { setSel(null); setItems([]); setCartId(null); setWaiter(""); }

  async function cartAction(body: Record<string, unknown>) {
    const r = await fetch("/api/mesas/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json());
    if (r.items) setItems(r.items);
    if (r.cart_id) setCartId(r.cart_id);
    return r;
  }
  async function addProduct(p: Product) {
    if (!sel) return;
    await cartAction({ action: "add", table_id: sel.id, waiter, product_id: p.id, name: p.name, price: p.price, qty: 1 });
  }
  async function changeQty(it: CartItem, delta: number) {
    if (!cartId) return;
    await cartAction({ action: "qty", item_id: it.id, cart_id: cartId, qty: it.qty + delta });
  }
  async function saveWaiter() {
    if (!sel) return;
    await cartAction({ action: "open", table_id: sel.id, waiter });
  }
  async function charge(payment: string) {
    if (!cartId) return;
    const r = await fetch("/api/mesas/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "close", cart_id: cartId, payment }) }).then((x) => x.json());
    if (r.error) { alert(r.error); return; }
    closePanel(); reload();
  }
  async function moveTo(toTableId: number) {
    if (!cartId) return;
    await fetch("/api/mesas/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "move", cart_id: cartId, to_table_id: toTableId }) });
    closePanel(); reload();
  }
  async function marchar() {
    if (!sel) return;
    const r = await fetch("/api/mesas/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "kitchen", table_id: sel.id }) }).then((x) => x.json());
    if (r.error) { alert(r.error); return; }
    if (r.items) setItems(r.items);
    alert("Comanda enviada a cocina 🍳");
  }

  // --- edición del salón ---
  async function addRoom() {
    const name = prompt("Nombre de la sala:", "Salón"); if (name == null) return;
    const r = await fetch("/api/mesas/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }).then((x) => x.json());
    setRoom(r.id); reload();
  }
  async function renameRoom() {
    if (room == null) return;
    const cur = rooms.find((x) => x.id === room);
    const name = prompt("Nuevo nombre de la sala:", cur?.name || ""); if (name == null) return;
    await fetch(`/api/mesas/rooms/${room}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    reload();
  }
  async function delRoom() {
    if (room == null) return;
    if (!confirm("¿Eliminar esta sala y todas sus mesas?")) return;
    await fetch(`/api/mesas/rooms/${room}`, { method: "DELETE" });
    setRoom(null); reload();
  }
  async function addTable() {
    if (room == null) { await addRoom(); return; }
    const n = shownTables.length + 1;
    await fetch("/api/mesas/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ room_id: room, name: String(n), pos_x: 20 + (n % 6) * 90, pos_y: 20 + Math.floor(n / 6) * 90 }) });
    reload();
  }
  async function editTable(t: TableT) {
    const name = prompt("Nombre/número de la mesa:", t.name); if (name == null) return;
    const seats = prompt("Cantidad de lugares:", String(t.seats)); if (seats == null) return;
    await fetch(`/api/mesas/tables/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, seats: Number(seats) || t.seats }) });
    reload();
  }
  async function delTable(t: TableT) {
    if (!confirm(`¿Eliminar la mesa ${t.name}?`)) return;
    await fetch(`/api/mesas/tables/${t.id}`, { method: "DELETE" });
    reload();
  }

  // Arrastrar una mesa en el mapa (solo en modo edición).
  function startDrag(e: React.MouseEvent, t: TableT) {
    if (!edit) return;
    e.preventDefault();
    const map = mapRef.current; if (!map) return;
    const rect = map.getBoundingClientRect();
    function onMove(ev: MouseEvent) {
      const x = Math.max(4, Math.min(rect.width - 76, ev.clientX - rect.left - 36));
      const y = Math.max(4, Math.min(rect.height - 76, ev.clientY - rect.top - 36));
      setTables((ts) => ts.map((x2) => (x2.id === t.id ? { ...x2, pos_x: x, pos_y: y } : x2)));
    }
    function onUp(ev: MouseEvent) {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const x = Math.max(4, Math.min(rect.width - 76, ev.clientX - rect.left - 36));
      const y = Math.max(4, Math.min(rect.height - 76, ev.clientY - rect.top - 36));
      fetch(`/api/mesas/tables/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pos_x: x, pos_y: y }) });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const cartTotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const filtered = search ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30) : products.slice(0, 30);

  if (loading) return <p className="py-12 text-center text-neutral-400">Cargando…</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🍽️ Salón</h1>
          <p className="text-neutral-500">Tocá una mesa para tomar el pedido y cobrar. Las cuentas cobradas van a la Caja.</p>
        </div>
        {canConfig && (
          <button onClick={() => { setEdit((v) => !v); closePanel(); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${edit ? "bg-[var(--brand)] text-[var(--brand-text)]" : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
            {edit ? "✓ Listo" : "✏️ Editar salón"}
          </button>
        )}
      </div>

      {/* Salas */}
      <div className="flex flex-wrap items-center gap-2">
        {rooms.map((r) => (
          <button key={r.id} onClick={() => { setRoom(r.id); closePanel(); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${room === r.id ? "bg-[var(--brand)] text-[var(--brand-text)]" : "bg-neutral-100 text-neutral-600"}`}>
            {r.name}
          </button>
        ))}
        {edit && (
          <>
            <button onClick={addRoom} className="rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-50">+ Sala</button>
            {room != null && <button onClick={renameRoom} className="text-xs text-neutral-500 hover:underline">renombrar</button>}
            {room != null && rooms.length > 1 && <button onClick={delRoom} className="text-xs text-red-500 hover:underline">borrar sala</button>}
          </>
        )}
      </div>

      {/* Mapa del salón */}
      <div className="relative">
        <div ref={mapRef} className="relative h-[440px] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          {shownTables.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-sm text-neutral-400">
              {edit ? "Agregá mesas con el botón de abajo." : "No hay mesas en esta sala."}
            </div>
          )}
          {shownTables.map((t) => {
            const occupied = !!t.cart_id && t.items > 0;
            return (
              <div
                key={t.id}
                onMouseDown={(e) => startDrag(e, t)}
                onClick={() => (edit ? editTable(t) : openTable(t))}
                style={{ left: t.pos_x, top: t.pos_y }}
                className={`absolute grid h-[72px] w-[72px] cursor-pointer select-none place-items-center rounded-2xl text-center shadow-sm ring-2 transition ${
                  occupied ? "bg-[var(--brand)] text-[var(--brand-text)] ring-[var(--brand)]" : "bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-300"
                } ${edit ? "cursor-move" : ""}`}
              >
                <div>
                  <p className="text-sm font-black leading-none">{t.name}</p>
                  {occupied ? (
                    <p className="mt-1 text-[10px] font-semibold leading-tight">{money(t.total)}</p>
                  ) : (
                    <p className="mt-1 text-[10px] text-neutral-400">{t.seats}👤</p>
                  )}
                </div>
                {edit && (
                  <button onClick={(e) => { e.stopPropagation(); delTable(t); }} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-xs text-white shadow">×</button>
                )}
                {!edit && t.ready > 0 && (
                  <span title="Comanda lista para entregar" className="absolute -left-2 -top-2 animate-bounce rounded-full bg-green-500 px-1.5 text-xs shadow ring-2 ring-white">🔔</span>
                )}
              </div>
            );
          })}
        </div>
        {edit && (
          <button onClick={addTable} className="mt-3 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm">+ Agregar mesa</button>
        )}
      </div>

      {/* Estadísticas */}
      {stats.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <p className="border-b border-neutral-100 px-5 py-3 text-sm font-bold">📊 Mesas con más ventas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-100">
                {stats.slice(0, 8).map((s) => (
                  <tr key={s.table_id}>
                    <td className="px-5 py-2.5 font-medium">Mesa {s.name}</td>
                    <td className="px-5 py-2.5 text-right text-neutral-500 tabular-nums">{s.orders} cuenta{s.orders === 1 ? "" : "s"}</td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel de cuenta */}
      {sel && !edit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={closePanel}>
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Mesa {sel.name}</h2>
                <p className="text-xs text-neutral-400">{items.length ? `${items.reduce((s, i) => s + i.qty, 0)} ítems` : "Cuenta vacía"}</p>
              </div>
              <button onClick={closePanel} className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {/* Mesero */}
              <label className="block">
                <span className="text-xs font-medium text-neutral-500">Mesero/a</span>
                <input value={waiter} onChange={(e) => setWaiter(e.target.value)} onBlur={saveWaiter} placeholder="Nombre del mesero"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              </label>

              {/* Consumos */}
              {items.length > 0 && (
                <div className="space-y-1.5">
                  {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm">
                      <span className="flex-1">{it.name}</span>
                      <button onClick={() => changeQty(it, -1)} className="grid h-6 w-6 place-items-center rounded-full bg-white ring-1 ring-neutral-200">−</button>
                      <span className="w-6 text-center tabular-nums">{it.qty}</span>
                      <button onClick={() => changeQty(it, 1)} className="grid h-6 w-6 place-items-center rounded-full bg-white ring-1 ring-neutral-200">+</button>
                      <span className="w-16 text-right font-semibold tabular-nums">{money(it.qty * it.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar consumo */}
              <div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto para agregar…"
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                  {filtered.map((p) => (
                    <button key={p.id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50">
                      <span>{p.name}</span>
                      <span className="text-neutral-400">{money(p.price)}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="px-3 py-2 text-sm text-neutral-400">Sin resultados.</p>}
                </div>
              </div>

              {/* Acciones */}
              {cartId && items.length > 0 && hasCocina && (
                <button onClick={marchar} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-95">
                  🍳 Marchar a cocina
                </button>
              )}

              {/* Trasladar */}
              {cartId && items.length > 0 && (
                <div>
                  <button onClick={() => setMoving((v) => !v)} className="text-sm text-[var(--brand)] hover:underline">↔ Trasladar a otra mesa</button>
                  {moving && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {shownTables.filter((t) => t.id !== sel.id).map((t) => (
                        <button key={t.id} onClick={() => moveTo(t.id)} className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200">Mesa {t.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cobro */}
            <div className="border-t border-neutral-100 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total</span>
                <span className="text-2xl font-black">{money(cartTotal)}</span>
              </div>
              {cartId && items.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENTS.map((p) => (
                    <button key={p.key} onClick={() => charge(p.key)} className="rounded-xl bg-[var(--brand)] px-2 py-2.5 text-xs font-semibold text-[var(--brand-text)] shadow-sm">
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-neutral-400">Agregá consumos para poder cobrar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
