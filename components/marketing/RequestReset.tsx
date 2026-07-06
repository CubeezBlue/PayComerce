"use client";

import { useState } from "react";
import Link from "next/link";

export default function RequestReset() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    setSent(true);
  }

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link href="/entrar" className="mb-6 text-sm text-[var(--pc)]">← Volver a ingresar</Link>
      <h1 className="text-2xl font-bold">Recuperar contraseña</h1>

      {sent ? (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
          Si el email está registrado, te enviamos un enlace para restablecer tu contraseña. Revisá tu casilla (y el spam). El enlace vence en 1 hora.
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-neutral-500">Ingresá tu email y te mandamos un enlace para elegir una nueva contraseña.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email de tu cuenta" autoFocus
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
            />
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60">
              {busy ? "Enviando…" : "Enviar enlace"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
