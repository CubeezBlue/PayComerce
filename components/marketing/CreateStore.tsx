"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, PLAN_ORDER, ADDONS } from "@/lib/plans";
import { formatPrice } from "@/lib/format";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function CreateStore({ baseHost }: { baseHost: string }) {
  const [step, setStep] = useState<"plan" | "datos">("plan");
  const [plan, setPlan] = useState<string>("emprendedor");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const effSlug = touchedSlug ? slug : slugify(name);

  async function create() {
    setError("");
    if (!name.trim()) { setError("Poné el nombre de tu negocio"); return; }
    if (password.length < 4) { setError("La contraseña debe tener 4+ caracteres"); return; }
    if (!accepted) { setError("Tenés que aceptar los Términos y la Política de Privacidad"); return; }
    setCreating(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: effSlug, password, plan }),
    });
    if (!res.ok) { setCreating(false); setError((await res.json()).error || "No se pudo crear"); return; }
    // Quedan logueados (el API setea la cookie): los llevamos directo a configurar su tienda.
    window.location.href = `/t/${effSlug}/admin/configuracion?bienvenida=1`;
  }

  // Paso 1 — elegir plan
  if (step === "plan") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-14">
        <Link href="/precios" className="text-sm text-[var(--pc)]">← Volver</Link>
        <h1 className="mt-3 text-3xl font-black">Elegí tu plan</h1>
        <p className="mt-2 text-neutral-500">Empezás con el plan que quieras y lo cambiás cuando necesites. Sin permanencia.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const active = plan === id;
            const popular = id === "profesional";
            return (
              <button
                key={id}
                onClick={() => setPlan(id)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition ${
                  active ? "border-[var(--pc)] bg-[var(--pc)]/5 shadow-md" : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-[var(--pc)] px-3 py-0.5 text-xs font-semibold text-white">Más elegido</span>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold">{p.name}</span>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${active ? "border-[var(--pc)] bg-[var(--pc)] text-white" : "border-neutral-300"}`}>
                    {active && <span className="text-[11px]">✓</span>}
                  </span>
                </div>
                <span className="mt-1 text-2xl font-black">{formatPrice(p.price)}<span className="text-sm font-normal text-neutral-400">/mes</span></span>
                <span className="mt-1 text-xs text-neutral-500">{p.tagline}</span>
                <ul className="mt-3 space-y-1 text-sm text-neutral-600">
                  <li>✓ {p.productLimit ? `Hasta ${p.productLimit} productos` : "Productos ilimitados"}</li>
                  {p.includedAddons.map((k) => (
                    <li key={k} className="font-medium text-green-700">★ {ADDONS.find((a) => a.key === k)?.name} incluido</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs text-neutral-400">Podés probar con el plan Emprendedor y subir cuando vendas más.</p>
          <button onClick={() => setStep("datos")} className="rounded-full bg-[var(--pc)] px-8 py-3 font-semibold text-white shadow-sm">
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // Paso 2 — datos de la tienda
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <button onClick={() => setStep("plan")} className="text-sm text-[var(--pc)]">← Cambiar plan</button>
      <h1 className="mt-3 text-3xl font-black">Creá tu tienda</h1>
      <p className="mt-2 text-neutral-500">
        Plan <b>{PLANS[plan as keyof typeof PLANS].name}</b> · {formatPrice(PLANS[plan as keyof typeof PLANS].price)}/mes. En un minuto la tenés lista.
      </p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Nombre de tu negocio</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pizzería Don José"
            autoFocus
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Dirección de tu tienda</span>
          <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-neutral-200 focus-within:border-[var(--pc)]">
            <span className="shrink-0 bg-neutral-100 px-3 py-3 text-sm text-neutral-500">{baseHost}/t/</span>
            <input
              value={effSlug}
              onChange={(e) => { setTouchedSlug(true); setSlug(slugify(e.target.value)); }}
              placeholder="pizzeria-don-jose"
              className="min-w-0 flex-1 px-3 py-3 outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Contraseña del panel</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Para entrar a administrar tu tienda"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--pc)]"
          />
          <span>
            Acepto los{" "}
            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--pc)] underline">Términos y Condiciones</a>{" "}
            y la{" "}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--pc)] underline">Política de Privacidad</a>.
          </span>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={create}
          disabled={creating || !accepted}
          className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {creating ? "Creando tu tienda…" : "Crear mi tienda y configurar"}
        </button>
        <p className="text-center text-xs text-neutral-400">Al crearla entrás directo a configurar tu logo, colores y horarios.</p>
      </div>
    </div>
  );
}
