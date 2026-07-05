import Link from "next/link";
import { getSettings, getCategories } from "@/lib/db";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const CAT_EMOJI: Record<string, string> = {
  pizza: "🍕", hamburguesa: "🍔", bebida: "🥤", postre: "🍰",
  empanada: "🥟", ensalada: "🥗", café: "☕", cafe: "☕",
};
function emojiFor(name: string) {
  const k = name.toLowerCase();
  for (const key of Object.keys(CAT_EMOJI)) if (k.includes(key)) return CAT_EMOJI[key];
  return "🍽️";
}

export default async function HomePage() {
  const db = await getRequestStoreDb();
  const settings = getSettings(db);
  const categories = getCategories(db);
  const storeName = settings.store_name || "PayComerce";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {settings.hero_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {/* Velo lateral: la foto se ve a la derecha, el texto queda legible a la izquierda */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 60%, black))" }}
          />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-white sm:py-24">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold ring-1 ring-white/30 backdrop-blur">
            {settings.hours || "Abierto ahora"}
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight drop-shadow sm:text-5xl">
            {settings.tagline || storeName}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/95 drop-shadow">
            {settings.hero_subtitle || "Pedí online, rápido y fácil."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="rounded-full bg-white px-6 py-3 font-semibold text-neutral-900 shadow-lg transition hover:scale-105">
              Ver menú
            </Link>
            <Link href="/contacto" className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/15">
              Cómo llegar
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/90">
            <span>🛵 Delivery y retiro</span>
            <span>💳 Pago online o al recibir</span>
            <span>🧾 Factura A/B/C</span>
          </div>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--c-title)]">Explorá la carta</h2>
            <p className="mt-1 text-[var(--c-muted)]">Elegí una categoría y armá tu pedido.</p>
          </div>
          <Link href="/menu" className="hidden text-sm font-semibold text-[var(--c-title)] sm:block">Ver todo →</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href="/menu"
              className="group flex flex-col items-center gap-3 rounded-2xl bg-[var(--c-card)] p-6 text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--brand)]/10 text-3xl transition group-hover:scale-110">
                {emojiFor(c.name)}
              </span>
              <span className="font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Franja "cómo funciona" */}
      <section className="py-14">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
          {[
            { icon: "📖", t: "1. Elegí", d: "Recorré el menú y agregá al carrito." },
            { icon: "💳", t: "2. Pagá", d: "Online o al recibir. Con factura si la necesitás." },
            { icon: "🛵", t: "3. Recibí", d: "Delivery a tu casa o retiro en el local." },
          ].map((s) => (
            <div key={s.t} className="rounded-2xl bg-[var(--c-card)] p-6 text-center text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-[var(--c-card-muted)]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
