"use client";

import { useState } from "react";

// Pantalla que reemplaza el panel cuando la suscripción no está activa.
// Sin suscripción no se puede usar la cuenta: solo se puede pagar o salir.
export default function SubscriptionPaywall({ base = "", state, storeName = "" }: { base?: string; state: "pending" | "past_due" | "expired"; storeName?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function subscribe() {
    setBusy(true); setError("");
    const res = await fetch("/api/subscription/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billing: "monthly" }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && data.init_point) window.location.href = data.init_point;
    else setError(data.error || "No se pudo iniciar la suscripción.");
  }

  const lapsed = state === "past_due" || state === "expired";

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--pc)]/10 text-3xl">{lapsed ? "⏸️" : "💳"}</div>
      <h1 className="mt-5 text-2xl font-black">
        {lapsed ? "Tu cuenta está suspendida" : "Activá tu suscripción"}
      </h1>
      <p className="mt-2 text-neutral-500">
        {lapsed
          ? `${storeName || "Tu tienda"} quedó suspendida porque no pudimos cobrar la suscripción. Reactivá el pago para volver a usar tu panel.`
          : "Para empezar a usar tu panel, dejá tu tarjeta en Mercado Pago. Tenés 14 días de prueba gratis y el primer cobro es recién al día 14. Cancelás cuando quieras."}
      </p>
      <button onClick={subscribe} disabled={busy} className="mt-6 w-full rounded-full bg-[#009ee3] py-3 font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60">
        {busy ? "Abriendo Mercado Pago…" : lapsed ? "Reactivar mi suscripción" : "Activar mi suscripción"}
      </button>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <button onClick={() => window.location.reload()} className="mt-4 text-sm text-[var(--pc)] hover:underline">
        Ya pagué — verificar
      </button>
      <button
        onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = `${base}/ingresar`; }}
        className="mt-6 text-xs text-neutral-400 hover:underline"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
