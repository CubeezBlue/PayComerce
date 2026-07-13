"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartContext";
import { Branch, DeliveryBand } from "@/lib/types";
import { distanceKm, bandForDistance, parseDeliveryPolygon, pointInPolygon } from "@/lib/geo";
import AddressAutocomplete from "./AddressAutocomplete";

type Settings = Record<string, string>;

type Delivery = "delivery" | "pickup";
type Payment = "online" | "cash" | "transfer";

function orderCode() {
  return "PC-" + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString().slice(-4);
}

export default function Checkout({ settings, branches, bands = [] }: { settings: Settings; branches: Branch[]; bands?: DeliveryBand[] }) {
  const { lines, subtotal, clear, setCheckoutOpen, branchId, setBranchModalOpen } = useCart();
  const onClose = () => setCheckoutOpen(false);
  const onDone = () => { clear(); setCheckoutOpen(false); };
  const currency = settings.currency || "$";
  const branch = branches.find((b) => b.id === branchId) ?? branches[0] ?? null;
  const multiBranch = branches.length > 1;
  const deliveryCost = Number(settings.delivery_cost || 0);
  const onlineEnabled = settings.online_payment === "1";

  const [step, setStep] = useState<"form" | "paying" | "success">("form");
  const [stockError, setStockError] = useState<string[]>([]);
  const [delivery, setDelivery] = useState<Delivery>("delivery");
  const [payment, setPayment] = useState<Payment>(onlineEnabled ? "online" : "cash");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [wantInvoice, setWantInvoice] = useState(false);
  const [cuit, setCuit] = useState("");
  const [code] = useState(orderCode);

  // Delivery con geocerca: por zona dibujada (polígono) o por radio (círculo).
  const branchBands = branch ? bands.filter((b) => b.branch_id === branch.id) : [];
  const poly = parseDeliveryPolygon(branch?.delivery_polygon);
  const usePoly = !!poly;
  const geofenceOn =
    settings.delivery_enabled === "1" && !!branch?.lat && !!branch?.lon && (usePoly || branchBands.length > 0);

  // Franja/cobertura aplicable según la dirección elegida en el mapa.
  const distance = geofenceOn && !usePoly && coords && branch?.lat != null && branch?.lon != null
    ? distanceKm(branch.lat, branch.lon, coords.lat, coords.lon)
    : null;
  const band = usePoly
    ? (poly ? { cost: poly.cost, min_order: poly.min_order } : null)
    : (distance != null ? bandForDistance(distance, branchBands) : null);
  // ¿La dirección elegida cae dentro de la zona?
  const covered = usePoly
    ? (coords ? pointInPolygon(coords.lat, coords.lon, poly!.points) : null)
    : (distance != null ? band !== null : null);
  const outOfCoverage = geofenceOn && coords != null && covered === false; // dirección elegida pero fuera de cobertura
  const needsAddressPick = geofenceOn && delivery === "delivery" && coords === null; // falta elegir del mapa

  const shipping = delivery === "delivery" ? (geofenceOn ? (band?.cost ?? 0) : deliveryCost) : 0;
  const total = subtotal + shipping;
  const belowMin = !!band && band.min_order > 0 && subtotal < band.min_order && !outOfCoverage;

  const errors: string[] = [];
  if (!name.trim()) errors.push("nombre");
  if (!phone.trim()) errors.push("teléfono");
  if (delivery === "delivery" && !address.trim()) errors.push("dirección");
  if (delivery === "delivery" && needsAddressPick) errors.push("elegí tu dirección del mapa");
  if (wantInvoice && cuit.trim().length < 8) errors.push("CUIT/DNI");
  const valid = errors.length === 0 && !belowMin && !(delivery === "delivery" && outOfCoverage);

  function buildWhatsAppText() {
    const msg: string[] = [];
    msg.push(`*Nuevo pedido ${code}* — ${settings.store_name || "PayComerce"}`);
    if (branch && multiBranch) msg.push(`Sucursal: ${branch.name}`);
    msg.push("");
    lines.forEach((l) => {
      msg.push(`• ${l.qty}x ${l.name} — ${formatPrice(l.price * l.qty, currency)}`);
      if (l.options) msg.push(`   ${l.options}`);
    });
    msg.push("");
    msg.push(`Subtotal: ${formatPrice(subtotal, currency)}`);
    if (shipping > 0) msg.push(`Envío: ${formatPrice(shipping, currency)}`);
    msg.push(`*Total: ${formatPrice(total, currency)}*`);
    msg.push("");
    msg.push(`Cliente: ${name}`);
    msg.push(`Teléfono: ${phone}`);
    msg.push(delivery === "delivery" ? `Entrega: Delivery — ${address}${distance != null ? ` (~${distance.toFixed(1)} km)` : ""}` : "Entrega: Retiro en local");
    const pLabel = payment === "online" ? "Pagado online ✅" : payment === "cash" ? "Efectivo" : "Transferencia";
    msg.push(`Pago: ${pLabel}`);
    if (wantInvoice) msg.push(`Factura: Sí (CUIT/DNI ${cuit})`);
    if (notes.trim()) msg.push(`Notas: ${notes}`);
    return encodeURIComponent(msg.join("\n"));
  }

  function sendWhatsApp() {
    // El pedido va al WhatsApp de la sucursal; si no tiene, al general de la tienda
    const num = (branch?.whatsapp_number || settings.whatsapp_number || "").replace(/\D/g, "");
    window.open(`https://wa.me/${num}?text=${buildWhatsAppText()}`, "_blank");
  }

  function orderPayload() {
    return {
      code,
      branch_id: branch?.id ?? null,
      customer_name: name,
      phone,
      address: delivery === "delivery" && distance != null ? `${address} (~${distance.toFixed(1)} km)` : address,
      delivery,
      payment,
      notes,
      items: lines.map((l) => ({
        product_id: l.productId,
        name: l.options ? `${l.name} (${l.options})` : l.name,
        qty: l.qty,
        price: l.price,
      })),
      subtotal,
      shipping,
      total,
      invoice: wantInvoice,
      cuit,
    };
  }

  // Guarda el pedido en el tablero. Devuelve true si se creó; si faltó stock,
  // carga stockError y devuelve false para frenar el flujo.
  async function persistOrder(): Promise<boolean> {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload()),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setStockError(Array.isArray(data.items) ? data.items : ["Algún producto se quedó sin stock"]);
        return false;
      }
      return true;
    } catch {
      // Error de red: no bloqueamos la venta (el comercio la puede tomar igual)
      return true;
    }
  }

  async function startMercadoPago() {
    setStep("paying");
    try {
      const res = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload()),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setStockError(Array.isArray(data.items) ? data.items : ["Algún producto se quedó sin stock"]);
        setStep("form");
        return;
      }
      const data = await res.json();
      if (res.ok && data.init_point) {
        // El pedido ya quedó guardado por la API; redirigimos a pagar
        window.location.href = data.init_point;
        return;
      }
    } catch {
      /* cae al flujo simulado */
    }
    // Si MP no está disponible, no perdemos la venta: guardamos y mostramos éxito
    if (!(await persistOrder())) { setStep("form"); return; }
    setStep("success");
  }

  async function confirm() {
    if (!valid) return;
    setStockError([]);
    if (payment === "online") {
      if (settings.mp_enabled === "1") {
        startMercadoPago();
        return;
      }
      // Simulación de pasarela de pago (demo)
      setStep("paying");
      if (!(await persistOrder())) { setStep("form"); return; }
      setTimeout(() => setStep("success"), 1800);
    } else {
      if (!(await persistOrder())) return;
      sendWhatsApp();
      setStep("success");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "form" && (
          <>
            <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <h2 className="text-lg font-bold">Finalizar pedido</h2>
              <button onClick={onClose} className="text-2xl leading-none text-neutral-400 hover:text-neutral-700">×</button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Sucursal */}
              {multiBranch && branch && (
                <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                  <span>📍 Pedís en <b>{branch.name}</b></span>
                  <button onClick={() => { onClose(); setBranchModalOpen(true); }} className="font-semibold text-[var(--brand)] underline">
                    Cambiar
                  </button>
                </div>
              )}

              {/* Entrega */}
              <Field label="¿Cómo lo recibís?">
                <div className="grid grid-cols-2 gap-2">
                  <Toggle active={delivery === "delivery"} onClick={() => setDelivery("delivery")}>🛵 Delivery</Toggle>
                  <Toggle active={delivery === "pickup"} onClick={() => setDelivery("pickup")}>🏬 Retiro</Toggle>
                </div>
              </Field>

              <Input placeholder="Nombre y apellido" value={name} onChange={setName} />
              <Input placeholder="Teléfono / WhatsApp" value={phone} onChange={setPhone} />
              {delivery === "delivery" && (
                <div>
                  <AddressAutocomplete
                    value={address}
                    onChange={(v) => { setAddress(v); setCoords(null); }}
                    onPick={(p) => { setAddress(p.label); setCoords({ lat: p.lat, lon: p.lon }); }}
                    placeholder="Dirección de entrega"
                  />
                  {geofenceOn && needsAddressPick && (
                    <p className="mt-1 text-xs text-neutral-400">Elegí tu dirección de la lista para calcular el envío.</p>
                  )}
                  {geofenceOn && covered === true && band && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Entrás en la zona de cobertura{distance != null ? ` (${distance.toFixed(1)} km)` : ""}. Envío: {band.cost > 0 ? formatPrice(band.cost, currency) : "Gratis"}.
                    </p>
                  )}
                  {geofenceOn && outOfCoverage && (
                    <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
                      Esa dirección está fuera de la zona de cobertura de {branch?.name}. Podés elegir <b>Retiro</b> o cambiar la dirección.
                    </p>
                  )}
                  {belowMin && band && (
                    <p className="mt-1 text-xs text-red-500">El pedido mínimo para tu zona es {formatPrice(band.min_order, currency)}.</p>
                  )}
                </div>
              )}

              {/* Pago */}
              <Field label="Forma de pago">
                <div className="grid grid-cols-3 gap-2">
                  {onlineEnabled && <Toggle active={payment === "online"} onClick={() => setPayment("online")}>💳 Online</Toggle>}
                  <Toggle active={payment === "cash"} onClick={() => setPayment("cash")}>💵 Efectivo</Toggle>
                  <Toggle active={payment === "transfer"} onClick={() => setPayment("transfer")}>🏦 Transfer.</Toggle>
                </div>
              </Field>

              {/* Factura (solo si el comercio tiene la integración ARCA) */}
              {settings.arca_enabled === "1" && (
                <>
                  <label className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
                    <input type="checkbox" checked={wantInvoice} onChange={(e) => setWantInvoice(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                    <span>Quiero factura (AFIP/ARCA)</span>
                  </label>
                  {wantInvoice && <Input placeholder="CUIT / DNI" value={cuit} onChange={setCuit} />}
                </>
              )}

              <Input placeholder="Notas (opcional): timbre, sin cebolla, etc." value={notes} onChange={setNotes} />
            </div>

            <footer className="space-y-3 border-t border-neutral-100 px-5 py-4">
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <span>Subtotal</span><span>{formatPrice(subtotal, currency)}</span>
              </div>
              {shipping > 0 && (
                <div className="flex items-center justify-between text-sm text-neutral-500">
                  <span>Envío</span><span>{formatPrice(shipping, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span><span>{formatPrice(total, currency)}</span>
              </div>
              <button
                disabled={!valid}
                onClick={confirm}
                className="w-full rounded-full bg-[var(--brand)] py-3 font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              >
                {payment === "online" ? `Pagar ${formatPrice(total, currency)}` : "Enviar pedido por WhatsApp"}
              </button>
              {!valid && (
                <p className="text-center text-xs text-neutral-400">Completá: {errors.join(", ")}</p>
              )}
              <p className="text-center text-[11px] leading-snug text-neutral-400">
                Al confirmar tu pedido aceptás los{" "}
                <a href="/terminos" target="_blank" rel="noopener noreferrer" className="underline">Términos</a> y la{" "}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline">Política de Privacidad</a>, y las condiciones del comercio.
              </p>
              {stockError.length > 0 && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  <p className="font-semibold">Nos quedamos sin stock</p>
                  <p className="mt-0.5">Ajustá las cantidades: {stockError.join(", ")}.</p>
                </div>
              )}
            </footer>
          </>
        )}

        {step === "paying" && (
          <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-[var(--brand)]" />
            <p className="font-semibold">{settings.mp_enabled === "1" ? "Redirigiendo a Mercado Pago…" : "Procesando pago…"}</p>
            <p className="text-sm text-neutral-500">
              {settings.mp_enabled === "1" ? "Te llevamos a pagar de forma segura." : "Conectando con la pasarela de pago (demo)"}
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl">✅</div>
            <h2 className="text-xl font-bold">
              {payment === "online" ? "¡Pago aprobado!" : "¡Pedido enviado!"}
            </h2>
            <p className="text-sm text-neutral-500">
              {payment === "online"
                ? "Tu pago se acreditó correctamente. El local ya recibió el pedido."
                : "Se abrió WhatsApp con tu pedido. Confirmalo enviando el mensaje al local."}
            </p>

            <div className="mt-2 w-full rounded-2xl bg-neutral-50 p-4 text-left text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Pedido</span><b>{code}</b></div>
              <div className="flex justify-between"><span className="text-neutral-500">Total</span><b>{formatPrice(total, currency)}</b></div>
              {wantInvoice && (
                <div className="mt-2 rounded-lg bg-white p-2 text-xs text-neutral-500 ring-1 ring-black/5">
                  🧾 Factura solicitada (CUIT/DNI {cuit}) — te la enviamos una vez confirmado el pago.
                </div>
              )}
            </div>

            {payment === "online" && (
              <button onClick={sendWhatsApp} className="mt-1 text-sm font-semibold text-[var(--accent-ink)] underline">
                Avisar al local por WhatsApp
              </button>
            )}
            <button onClick={onDone} className="mt-3 w-full rounded-full bg-[var(--brand)] py-3 font-semibold text-[var(--brand-text)]">
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        active ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
    />
  );
}
