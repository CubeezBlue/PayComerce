"use client";

import { useState } from "react";
import Link from "next/link";
import { validatePassword } from "@/lib/validation";

export default function ResetPassword({ token }: { token: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const err = validatePassword(pw);
    if (err) { setError(err); return; }
    if (pw !== pw2) { setError("Las contraseñas no coinciden"); return; }
    setBusy(true);
    const res = await fetch("/api/restablecer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: pw }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Error"); return; }
    setDone(true);
  }

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">Nueva contraseña</h1>

      {!token ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">
          El enlace no es válido. Pedí uno nuevo desde <Link href="/recuperar" className="underline">recuperar contraseña</Link>.
        </p>
      ) : done ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
            ✅ Tu contraseña se actualizó. Ya podés ingresar.
          </div>
          <Link href="/entrar" className="block rounded-full bg-[var(--pc)] py-3 text-center font-semibold text-white">Ir a ingresar</Link>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-neutral-500">Elegí una nueva contraseña para tu cuenta.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="password" value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="Nueva contraseña" autoFocus autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
            />
            <p className="text-xs text-neutral-400">Mínimo 8 caracteres, con una mayúscula, un número y un carácter especial.</p>
            <input
              type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
              placeholder="Repetir contraseña" autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60">
              {busy ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
