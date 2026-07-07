"use client";

import { useState } from "react";
import { PLANS, PLAN_ORDER, FEATURE_LABELS, ADDONS, Feature } from "@/lib/plans";
import { formatPrice } from "@/lib/format";

const ALL_FEATURES: Feature[] = ["variants", "excel", "price_adjust", "orders_board", "dashboard_full", "branches", "reports"];

export default function PlanManager({ initial, base = "" }: { initial: Record<string, string>; base?: string }) {
  const [plan, setPlan] = useState(initial.plan || "empresa");
  const [addons, setAddons] = useState<Record<string, boolean>>(
    Object.fromEntries(ADDONS.map((a) => [a.key, initial[`addon_${a.key}`] === "1"]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [paused, setPaused] = useState(initial.paused === "1");
  const [pauseBusy, setPauseBusy] = useState(false);

  async function togglePause() {
    setPauseBusy(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !paused }),
    });
    setPauseBusy(false);
    if (res.ok) setPaused((p) => !p);
  }

  async function deleteStore() {
    if (!confirm("¿Eliminar tu tienda DEFINITIVAMENTE? Se borran todos tus productos, pedidos y datos. Esta acción NO se puede deshacer.")) return;
    if (!confirm("Confirmá de nuevo: esto es irreversible y perdés todo.")) return;
    const res = await fetch("/api/store", { method: "DELETE" });
    if (res.ok) { window.location.href = "/precios"; }
    else alert((await res.json()).error || "No se pudo eliminar");
  }

  // Estado de credenciales cargadas (para avisar qué falta para que la integración cobre/facture de verdad).
  const configured: Record<string, boolean> = {
    mp: !!initial.mp_access_token?.trim(),
    arca: !!(initial.afip_access_token?.trim() && initial.afip_cuit?.trim()),
  };

  // Addons incluidos sin costo según el plan elegido (no suman ni se pueden desactivar).
  const includedAddons = PLANS[plan as keyof typeof PLANS].includedAddons as string[];
  const addonsTotal = ADDONS.filter((a) => addons[a.key] && !a.soon && !includedAddons.includes(a.key)).reduce((s, a) => s + a.price, 0);
  const total = PLANS[plan as keyof typeof PLANS].price + addonsTotal;

  async function save() {
    setSaving(true);
    const body: Record<string, string> = { plan };
    // Los addons "próximamente" nunca se guardan activos.
    for (const a of ADDONS) body[`addon_${a.key}`] = addons[a.key] && !a.soon ? "1" : "";
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi plan</h1>
        <p className="text-neutral-500">Elegí tu plan y las integraciones. Se activan o desactivan funciones al instante.</p>
      </div>

      {/* Planes */}
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const active = plan === id;
          return (
            <button
              key={id}
              onClick={() => { setPlan(id); setSaved(false); }}
              className={`flex flex-col rounded-2xl border-2 p-5 text-left transition ${
                active ? "border-[var(--brand)] bg-[var(--brand)]/5 shadow-md" : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{p.name}</span>
                {active && <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-text)]">Actual</span>}
              </div>
              <span className="mt-1 text-2xl font-black">{formatPrice(p.price)}<span className="text-sm font-normal text-neutral-400">/mes</span></span>
              <span className="mt-1 text-xs text-neutral-500">{p.tagline}</span>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="text-neutral-600">✓ Tienda + WhatsApp + horarios</li>
                <li className="text-neutral-600">✓ {p.productLimit ? `Hasta ${p.productLimit} productos` : "Productos ilimitados"}</li>
                {ALL_FEATURES.filter((f) => p.features.includes(f)).map((f) => (
                  <li key={f} className="text-neutral-600">✓ {FEATURE_LABELS[f]}</li>
                ))}
                {p.includedAddons.map((k) => (
                  <li key={k} className="font-medium text-green-700">★ {ADDONS.find((a) => a.key === k)?.name} incluido</li>
                ))}
                {ALL_FEATURES.filter((f) => !p.features.includes(f)).map((f) => (
                  <li key={f} className="text-neutral-300">✕ {FEATURE_LABELS[f]}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Integraciones */}
      <div>
        <h2 className="font-bold">Integraciones</h2>
        <p className="text-sm text-neutral-500">Se suman a cualquier plan. Activá solo las que necesites.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ADDONS.map((a) => {
            const soon = !!a.soon;
            const included = includedAddons.includes(a.key); // viene con el plan
            const on = included || addons[a.key];
            const needsCreds = a.key in configured;
            const ready = needsCreds ? configured[a.key] : true;
            return (
              <label
                key={a.key}
                className={`flex items-start gap-3 rounded-2xl border-2 p-4 transition ${
                  soon || included ? "cursor-default" : "cursor-pointer"
                } ${soon ? "border-neutral-200 bg-neutral-50 opacity-70" : on ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
              >
                <input
                  type="checkbox"
                  checked={on && !soon}
                  disabled={soon || included}
                  onChange={(e) => { setAddons((s) => ({ ...s, [a.key]: e.target.checked })); setSaved(false); }}
                  className="mt-1 h-4 w-4 accent-[var(--brand)] disabled:opacity-40"
                />
                <span className="flex-1">
                  <span className="flex items-center justify-between">
                    <span className="font-semibold">{a.icon} {a.name}</span>
                    {soon ? (
                      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-500">Próximamente</span>
                    ) : included ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Incluido</span>
                    ) : (
                      <span className="text-sm font-bold">+{formatPrice(a.price)}</span>
                    )}
                  </span>
                  <span className="text-sm text-neutral-500">{a.desc}</span>
                  {/* Aviso de qué falta para que la integración funcione de verdad */}
                  {on && !soon && needsCreds && (
                    ready ? (
                      <span className="mt-1 block text-xs font-medium text-green-600">✅ Credenciales cargadas — lista para operar.</span>
                    ) : (
                      <span className="mt-1 block text-xs font-medium text-amber-600">
                        ⚠️ Falta cargar tus credenciales en{" "}
                        <a href={`${base}/admin/configuracion`} className="underline">Configuración</a>. Hasta entonces funciona en modo demo.
                      </span>
                    )
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Total + guardar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">Total mensual estimado</p>
          <p className="text-3xl font-black">{formatPrice(total)}<span className="text-sm font-normal text-neutral-400">/mes</span></p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-600">✅ Guardado</span>}
          <button onClick={save} disabled={saving} className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar plan"}
          </button>
        </div>
      </div>

      {/* Estado de la tienda: pausar */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Pausar la tienda</h2>
            <p className="text-sm text-neutral-500">
              {paused
                ? "Tu tienda está EN PAUSA: los clientes ven un aviso y no pueden pedir. Vos seguís entrando al panel normalmente."
                : "Poné la tienda en pausa mientras actualizás productos o precios. Los clientes ven un aviso y no pueden hacer pedidos; el panel te sigue funcionando."}
            </p>
          </div>
          <button
            onClick={togglePause}
            disabled={pauseBusy}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60 ${
              paused ? "bg-green-600 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {pauseBusy ? "…" : paused ? "Reactivar tienda" : "Pausar tienda"}
          </button>
        </div>
        {paused && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200">⏸️ Tienda en pausa</p>}
      </div>

      {/* Zona de peligro: eliminar la tienda */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-5">
        <h2 className="font-bold text-red-700">Zona de peligro</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Al eliminar tu tienda se borran <b>todos</b> tus productos, pedidos y datos, y se libera la dirección. Esta acción es <b>irreversible</b>. Si solo querés dejar de vender un tiempo, mejor usá <b>Pausar</b>.
        </p>
        <button
          onClick={deleteStore}
          className="mt-4 rounded-full border-2 border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
        >
          Eliminar mi tienda
        </button>
      </div>
    </div>
  );
}
