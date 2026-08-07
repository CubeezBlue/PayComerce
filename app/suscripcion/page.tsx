import Link from "next/link";

export const dynamic = "force-dynamic";

// Página pública a la que MP devuelve al comercio después de dejar la tarjeta.
// No requiere sesión (así el "Volver al sitio" de MP siempre funciona).
export default async function SuscripcionOkPage({ searchParams }: { searchParams: Promise<{ tienda?: string }> }) {
  const slug = (await searchParams).tienda || "";
  const panel = slug ? `/t/${slug}/admin/plan` : "/entrar";
  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl">✅</div>
      <h1 className="mt-5 text-2xl font-black">¡Listo! Tu suscripción quedó activa</h1>
      <p className="mt-2 text-neutral-500">
        Ya dejaste tu tarjeta. Seguís con tus <b>14 días de prueba gratis</b> y el primer cobro se hace recién cuando termina.
        Podés cancelar cuando quieras desde tu panel.
      </p>
      <Link href={panel} className="mt-6 rounded-full bg-[var(--pc)] px-7 py-3 font-semibold text-white shadow-sm">
        Ir a mi panel
      </Link>
      <p className="mt-4 text-xs text-neutral-400">Si el cobro no se refleja al instante, puede tardar unos minutos en confirmarse.</p>
    </div>
  );
}
