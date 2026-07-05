"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS, PLAN_ORDER, FEATURE_LABELS, ADDONS, Feature } from "@/lib/plans";
import { formatPrice } from "@/lib/format";

const ALL: Feature[] = ["variants", "excel", "price_adjust", "orders_board", "dashboard_full", "branches", "reports"];
const POPULAR = "profesional";

const FAQ = [
  { q: "¿Necesito conocimientos técnicos?", a: "No. Cargás tus productos, elegís tu marca y tu tienda queda online. Todo desde el panel, sin programar nada." },
  { q: "¿Sirve para cualquier rubro?", a: "Sí. Gastronomía, indumentaria, kioscos, farmacias, ferreterías y más. Elegís tu rubro y generamos los textos por vos." },
  { q: "¿Cobro con Mercado Pago y facturo?", a: "Sí, con las integraciones de Pagos online y Facturación electrónica (ARCA). Se activan sobre cualquier plan cuando las necesites." },
  { q: "¿Puedo cambiar de plan cuando quiera?", a: "Cuando quieras, sin ataduras. Subís o bajás de plan y las funciones se activan al instante." },
  { q: "¿Tiene comisión por venta?", a: "No cobramos comisión por pedido. Pagás tu plan mensual y listo (las pasarelas de pago cobran su comisión aparte)." },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  function price(monthly: number) {
    return annual ? Math.round((monthly * 0.85) / 100) * 100 : monthly;
  }

  return (
    <div style={{ ["--pc" as string]: "#4f46e5", ["--pc2" as string]: "#7c3aed" }} className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--pc)] text-lg font-black text-white">P</span>
            <span className="text-lg font-bold">PayComerce</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
            <a href="#planes" className="hover:text-[var(--pc)]">Planes</a>
            <a href="#integraciones" className="hover:text-[var(--pc)]">Integraciones</a>
            <a href="#faq" className="hover:text-[var(--pc)]">Preguntas</a>
            <Link href="/t/demo" className="hover:text-[var(--pc)]">Ver una tienda</Link>
          </nav>
          <Link href="/crear-tienda" className="rounded-full bg-[var(--pc)] px-4 py-2 text-sm font-semibold text-white shadow-sm">
            Crear mi tienda
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(135deg, var(--pc), var(--pc2))" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center text-white sm:py-28">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20 backdrop-blur">
            Tu tienda online, pagos y facturación en un solo lugar
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Vendé online sin comisiones, sin complicaciones
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
            Armá tu catálogo, recibí pedidos por WhatsApp o con pago online y gestioná todo desde un panel simple.
            Para gastronomía, retail y cualquier comercio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/crear-tienda" className="rounded-full bg-white px-7 py-3 font-semibold text-[var(--pc)] shadow-lg transition hover:scale-105">
              Empezar gratis
            </Link>
            <Link href="/t/demo" className="rounded-full border border-white/50 px-7 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/10">
              Ver una tienda de ejemplo
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/70">Sin comisión por venta · Cancelás cuando quieras</p>
        </div>
      </section>

      {/* Beneficios */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "🛍️", t: "Tienda con tu marca", d: "Colores, logo y secciones a tu gusto. Se ve profesional en cualquier rubro." },
            { icon: "💬", t: "Pedidos por WhatsApp", d: "El cliente arma el pedido y te llega listo a tu WhatsApp." },
            { icon: "📊", t: "Gestión completa", d: "Tablero de pedidos en vivo, stock, sucursales y estadísticas de venta." },
            { icon: "🧾", t: "Cobrá y facturá", d: "Mercado Pago y factura electrónica ARCA, cuando los necesites." },
          ].map((b) => (
            <div key={b.t} className="rounded-2xl bg-neutral-50 p-6 ring-1 ring-black/5">
              <div className="text-3xl">{b.icon}</div>
              <h3 className="mt-3 font-bold">{b.t}</h3>
              <p className="mt-1 text-sm text-neutral-500">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Planes simples y transparentes</h2>
            <p className="mt-2 text-neutral-500">Elegí el que va con tu negocio. Cambiás cuando quieras.</p>
          </div>

          {/* Toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={!annual ? "font-semibold" : "text-neutral-400"}>Mensual</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              className="relative h-7 w-12 rounded-full bg-[var(--pc)] transition"
              aria-label="Cambiar facturación"
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${annual ? "left-6" : "left-1"}`} />
            </button>
            <span className={annual ? "font-semibold" : "text-neutral-400"}>
              Anual <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">-15%</span>
            </span>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const popular = id === POPULAR;
              return (
                <div
                  key={id}
                  className={`relative flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ${popular ? "ring-2 ring-[var(--pc)] shadow-xl" : "ring-black/5"}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--pc)] px-3 py-1 text-xs font-bold text-white">
                      Más elegido
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-black">{formatPrice(price(p.price))}</span>
                    <span className="text-sm text-neutral-400">/mes</span>
                    {annual && <p className="text-xs text-neutral-400">facturado anual</p>}
                  </div>
                  <Link
                    href="/crear-tienda"
                    className={`mt-5 rounded-full py-3 text-center font-semibold transition ${
                      popular ? "bg-[var(--pc)] text-white shadow-sm hover:scale-[1.02]" : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                    }`}
                  >
                    Empezar
                  </Link>
                  <ul className="mt-6 space-y-2 text-sm">
                    <li className="flex gap-2"><span className="text-[var(--pc)]">✓</span> Tienda con marca + WhatsApp</li>
                    <li className="flex gap-2"><span className="text-[var(--pc)]">✓</span> Horarios abierto/cerrado</li>
                    <li className="flex gap-2"><span className="text-[var(--pc)]">✓</span> {p.productLimit ? `Hasta ${p.productLimit} productos` : "Productos ilimitados"}</li>
                    {ALL.map((f) => (
                      <li key={f} className={`flex gap-2 ${p.features.includes(f) ? "" : "text-neutral-300"}`}>
                        <span className={p.features.includes(f) ? "text-[var(--pc)]" : ""}>{p.features.includes(f) ? "✓" : "✕"}</span>
                        {FEATURE_LABELS[f]}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integraciones */}
      <section id="integraciones" className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Integraciones a tu medida</h2>
          <p className="mt-2 text-neutral-500">Sumá solo lo que necesitás, sobre cualquier plan.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADDONS.map((a) => (
            <div key={a.key} className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--pc)]/10 text-2xl">{a.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{a.name}</h3>
                </div>
                <p className="text-sm text-neutral-500">{a.desc}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--pc)]">+{formatPrice(a.price)}/mes</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Por qué PayComerce */}
      <section className="bg-neutral-900 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">¿Por qué PayComerce?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              { t: "Pensado para vender online", d: "No es un sistema de caja pesado adaptado. Nace para que vendas por internet, simple y liviano." },
              { t: "Para cualquier comercio", d: "Gastronomía, ropa, kiosco, farmacia. No estás atado a un solo rubro." },
              { t: "Sin trabas ni comisiones", d: "Excel masivo y aumentos por % incluidos. Sin comisión por venta. Todo transparente." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <h3 className="font-bold">{b.t}</h3>
                <p className="mt-2 text-sm text-white/70">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl px-6 py-14 text-center text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--pc), var(--pc2))" }}>
          <h2 className="text-3xl font-black sm:text-4xl">Tu tienda lista hoy</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Empezá gratis y sumá pagos y facturación cuando estés listo para crecer.</p>
          <Link href="/crear-tienda" className="mt-7 inline-block rounded-full bg-white px-8 py-3 font-semibold text-[var(--pc)] shadow-lg transition hover:scale-105">
            Crear mi tienda
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 text-center text-sm text-neutral-400">
        <p className="font-semibold text-neutral-600">PayComerce</p>
        <p className="mt-1">Tu tienda online, pagos y facturación · Argentina</p>
      </footer>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-black/5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold">
        {q}
        <span className="text-neutral-400">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="px-5 pb-4 text-sm text-neutral-600">{a}</p>}
    </div>
  );
}
