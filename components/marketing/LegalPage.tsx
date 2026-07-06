import Link from "next/link";

// Contenedor de páginas legales (términos, privacidad) con la marca PayComerce.
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="min-h-screen bg-white text-neutral-800">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/precios" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--pc)] text-sm font-black text-white">P</span>
            <span className="font-bold">PayComerce</span>
          </Link>
          <Link href="/precios" className="text-sm text-[var(--pc)] hover:underline">← Volver</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-400">Última actualización: {updated}</p>

        <div className="legal mt-8 space-y-6 text-sm leading-relaxed text-neutral-600">
          {children}
        </div>

        <div className="mt-10 flex gap-4 border-t border-neutral-100 pt-6 text-sm">
          <Link href="/terminos" className="text-[var(--pc)] hover:underline">Términos y Condiciones</Link>
          <Link href="/privacidad" className="text-[var(--pc)] hover:underline">Política de Privacidad</Link>
        </div>
      </main>
    </div>
  );
}

// Bloque de sección con título, para reusar en las páginas legales.
export function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-neutral-900">{n}. {title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
