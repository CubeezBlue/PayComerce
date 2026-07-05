import Link from "next/link";
import { getSettings } from "@/lib/db";
import { parseFeatures } from "@/lib/rubros";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function NosotrosPage() {
  const settings = getSettings(await getRequestStoreDb());
  const storeName = settings.store_name || "PayComerce";
  const features = parseFeatures(settings.about_features);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="h-72 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand)]/15 to-[var(--brand)]/5 shadow-sm ring-1 ring-black/5">
          {settings.about_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.about_image} alt={storeName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-8xl">👨‍🍳</div>
          )}
        </div>
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--c-title)]">Nuestra historia</span>
          <h1 className="mt-2 text-3xl font-bold text-[var(--c-title)]">{storeName}</h1>
          <p className="mt-4 leading-relaxed text-[var(--c-text)] opacity-90">{settings.about_text || "Contá la historia de tu negocio acá."}</p>
          <Link href="/menu" className="mt-6 inline-block rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-text)] shadow-sm transition hover:scale-105">
            Ver el menú
          </Link>
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {features.map((v, i) => (
          <div key={i} className="rounded-2xl bg-[var(--c-card)] p-6 text-center text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5">
            <div className="text-3xl">{v.icon}</div>
            <h3 className="mt-3 font-bold">{v.title}</h3>
            <p className="mt-1 text-sm text-[var(--c-card-muted)]">{v.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
