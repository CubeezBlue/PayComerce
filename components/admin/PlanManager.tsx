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
    </div>
  );
}
