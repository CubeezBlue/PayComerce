"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";

// status viene de Mercado Pago: approved / pending / failure / rejected
export default function PagoRetorno({ status, order }: { status: string; order: string }) {
  const { clear } = useCart();
  const approved = status === "approved";
  const pending = status === "pending" || status === "in_process";

  useEffect(() => {
    if (approved) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approved]);

  const info = approved
    ? { icon: "✅", bg: "bg-green-100", title: "¡Pago aprobado!", text: "Tu pago se acreditó. El local ya recibió tu pedido." }
    : pending
    ? { icon: "⏳", bg: "bg-amber-100", title: "Pago pendiente", text: "Estamos esperando la confirmación del pago." }
    : { icon: "❌", bg: "bg-red-100", title: "El pago no se completó", text: "No se pudo procesar el pago. Podés intentar de nuevo." };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
      <div className={`grid h-20 w-20 place-items-center rounded-full ${info.bg} text-4xl`}>{info.icon}</div>
      <h1 className="text-2xl font-bold text-[var(--c-title)]">{info.title}</h1>
      <p className="text-[var(--c-text)] opacity-80">{info.text}</p>
      {order && <p className="text-sm text-[var(--c-muted)]">Pedido #{order}</p>}
      <div className="mt-4 flex gap-3">
        <Link href="/menu" className="rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--brand-text)] shadow-sm">
          {approved ? "Volver al menú" : "Reintentar"}
        </Link>
        <Link href="/" className="rounded-full border border-black/10 px-6 py-3 font-semibold">Inicio</Link>
      </div>
    </div>
  );
}
