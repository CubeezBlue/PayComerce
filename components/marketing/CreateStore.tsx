"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, PLAN_ORDER, ADDONS } from "@/lib/plans";
import { formatPrice } from "@/lib/format";
import { validatePassword, isValidEmail } from "@/lib/validation";
import { RUBROS } from "@/lib/rubros";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

type Step = "plan" | "datos" | "tienda" | "cuenta";
const STEPS: { k: Step; label: string }[] = [
  { k: "plan", label: "Plan" },
  { k: "datos", label: "Datos" },
  { k: "tienda", label: "Tienda" },
  { k: "cuenta", label: "Cuenta" },
];

export default function CreateStore({ baseHost }: { baseHost: string }) {
  const [step, setStep] = useState<Step>("plan");
  const [plan, setPlan] = useState<string>("emprendedor");
  // datos
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // tienda
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [rubro, setRubro] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  // cuenta
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [accepted, setAccepted] = useState(false);

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const effSlug = touchedSlug ? slug : slugify(storeName);
  const stepIdx = STEPS.findIndex((s) => s.k === step);

  function next() {
    setError("");
    if (step === "datos") {
      if (!firstName.trim()) return setError("Poné tu nombre");
      if (!isValidEmail(email)) return setError("Ingresá un email válido");
    }
    if (step === "tienda") {
      if (!storeName.trim()) return setError("Poné el nombre de tu tienda");
      if (effSlug.length < 3) return setError("La dirección debe tener 3+ caracteres");
      if (!whatsapp.trim()) return setError("Poné el WhatsApp donde te llegan los pedidos");
    }
    const order: Step[] = ["plan", "datos", "tienda", "cuenta"];
    setStep(order[Math.min(order.length - 1, stepIdx + 1)]);
  }
  function back() {
    setError("");
    const order: Step[] = ["plan", "datos", "tienda", "cuenta"];
    setStep(order[Math.max(0, stepIdx - 1)]);
  }

  async function create() {
    setError("");
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    if (password !== password2) return setError("Las contraseñas no coinciden");
    if (!accepted) return setError("Tenés que aceptar los Términos y la Política de Privacidad");
    setCreating(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: storeName.trim(), email: email.trim(), slug: effSlug, password, plan,
        whatsapp_number: whatsapp.trim(), business_type: rubro || "otro",
        owner_name: `${firstName} ${lastName}`.trim(), owner_phone: phone.trim(),
      }),
    });
    if (!res.ok) { setCreating(false); setError((await res.json()).error || "No se pudo crear"); return; }
    window.location.href = `/t/${effSlug}/admin/configuracion?bienvenida=1`;
  }

  const input = "mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]";

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/precios" className="text-sm text-[var(--pc)]">← Volver</Link>

      {/* Stepper */}
      <div className="mt-4 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.k} className="flex flex-1 items-center gap-2">
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i <= stepIdx ? "bg-[var(--pc)] text-white" : "bg-neutral-200 text-neutral-500"}`}>
              {i < stepIdx ? "✓" : i + 1}
            </div>
            <span className={`hidden text-sm sm:block ${i === stepIdx ? "font-semibold text-neutral-800" : "text-neutral-400"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < stepIdx ? "bg-[var(--pc)]" : "bg-neutral-200"}`} />}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {/* PASO 1: PLAN */}
        {step === "plan" && (
          <>
            <h1 className="text-2xl font-black">Elegí tu plan</h1>
            <p className="mt-1 text-neutral-500">Empezás con 14 días gratis. Cambiás o cancelás cuando quieras.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {PLAN_ORDER.map((id) => {
                const p = PLANS[id]; const active = plan === id; const popular = id === "profesional";
                return (
                  <button key={id} onClick={() => setPlan(id)} className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition ${active ? "border-[var(--pc)] bg-[var(--pc)]/5 shadow-md" : "border-neutral-200 hover:border-neutral-300"}`}>
                    {popular && <span className="absolute -top-3 left-4 rounded-full bg-[var(--pc)] px-2 py-0.5 text-xs font-semibold text-white">Más elegido</span>}
                    <span className="font-bold">{p.name}</span>
                    <span className="mt-1 text-xl font-black">{formatPrice(p.price)}<span className="text-xs font-normal text-neutral-400">/mes</span></span>
                    <span className="mt-1 text-xs text-neutral-500">{p.productLimit ? `Hasta ${p.productLimit} productos` : "Productos ilimitados"}</span>
                    {p.includedAddons.map((k) => <span key={k} className="mt-1 text-xs font-medium text-green-700">★ {ADDONS.find((a) => a.key === k)?.name} incluido</span>)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* PASO 2: DATOS */}
        {step === "datos" && (
          <>
            <h1 className="text-2xl font-black">Tus datos</h1>
            <p className="mt-1 text-neutral-500">Para tu cuenta y el contacto.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="text-sm font-medium text-neutral-700">Nombre</span>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={input} autoFocus /></label>
              <label className="block"><span className="text-sm font-medium text-neutral-700">Apellido</span>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={input} /></label>
              <label className="block sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tunombre@email.com" className={input} />
                <span className="mt-1 block text-xs text-neutral-400">Con esto ingresás y recuperás tu cuenta.</span></label>
              <label className="block sm:col-span-2"><span className="text-sm font-medium text-neutral-700">Celular (opcional)</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 351 ..." className={input} /></label>
            </div>
          </>
        )}

        {/* PASO 3: TIENDA */}
        {step === "tienda" && (
          <>
            <h1 className="text-2xl font-black">Tu tienda</h1>
            <p className="mt-1 text-neutral-500">Cómo se va a ver y dónde recibís los pedidos.</p>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="text-sm font-medium text-neutral-700">Nombre de la tienda</span>
                <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ej: Pizzería Don José" className={input} autoFocus /></label>
              <label className="block"><span className="text-sm font-medium text-neutral-700">Dirección de tu tienda</span>
                <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-neutral-200 focus-within:border-[var(--pc)]">
                  <span className="shrink-0 bg-neutral-100 px-3 py-3 text-sm text-neutral-500">{baseHost}/t/</span>
                  <input value={effSlug} onChange={(e) => { setTouchedSlug(true); setSlug(slugify(e.target.value)); }} placeholder="pizzeria-don-jose" className="min-w-0 flex-1 px-3 py-3 outline-none" />
                </div></label>
              <label className="block"><span className="text-sm font-medium text-neutral-700">Rubro</span>
                <select value={rubro} onChange={(e) => setRubro(e.target.value)} className={`${input} bg-white`}>
                  <option value="">Elegí tu rubro…</option>
                  {RUBROS.map((r) => <option key={r.key} value={r.key}>{r.emoji} {r.name}</option>)}
                </select>
                <span className="mt-1 block text-xs text-neutral-400">Generamos los textos de tu tienda según el rubro (los editás después).</span></label>
              <label className="block"><span className="text-sm font-medium text-neutral-700">WhatsApp de pedidos</span>
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 5493510000000" className={input} />
                <span className="mt-1 block text-xs text-neutral-400">A este número te llegan los pedidos.</span></label>
            </div>
          </>
        )}

        {/* PASO 4: CUENTA */}
        {step === "cuenta" && (
          <>
            <h1 className="text-2xl font-black">Tu contraseña</h1>
            <p className="mt-1 text-neutral-500">Plan <b>{PLANS[plan as keyof typeof PLANS].name}</b> · 14 días gratis. Última cosa y listo.</p>
            <div className="mt-6 space-y-4">
              <label className="block"><span className="text-sm font-medium text-neutral-700">Contraseña</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} autoFocus />
                <span className="mt-1 block text-xs text-neutral-400">Mínimo 8 caracteres, con una mayúscula, un número y un carácter especial.</span></label>
              <label className="block"><span className="text-sm font-medium text-neutral-700">Repetir contraseña</span>
                <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} className={input} />
                {password2 && password !== password2 && <span className="mt-1 block text-xs text-red-500">No coinciden.</span>}</label>
              <label className="flex items-start gap-2 text-sm text-neutral-600">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--pc)]" />
                <span>Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--pc)] underline">Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--pc)] underline">Política de Privacidad</a>.</span>
              </label>
            </div>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {/* Navegación */}
        <div className="mt-8 flex items-center justify-between">
          {stepIdx > 0 ? (
            <button onClick={back} className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">← Atrás</button>
          ) : <span />}
          {step !== "cuenta" ? (
            <button onClick={next} className="rounded-full bg-[var(--pc)] px-8 py-2.5 text-sm font-semibold text-white shadow-sm">Continuar →</button>
          ) : (
            <button onClick={create} disabled={creating || !accepted} className="rounded-full bg-[var(--pc)] px-8 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
              {creating ? "Creando tu tienda…" : "Crear mi tienda"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
