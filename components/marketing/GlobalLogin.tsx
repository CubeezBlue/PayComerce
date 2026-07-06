"use client";

import { useState } from "react";
import Link from "next/link";

export default function GlobalLogin() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Error"); return; }
    const { slug } = await res.json();
    window.location.href = `/t/${slug}/admin`;
  }

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <Link href="/precios" className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--pc)] text-lg font-black text-white">P</span>
        <div>
          <p className="font-bold leading-none">PayComerce</p>
          <p className="text-xs text-neutral-400">Ingresá a tu tienda</p>
        </div>
      </Link>
      <h1 className="text-2xl font-bold">Ingresar</h1>
      <p className="mt-1 text-sm text-neutral-500">Entrá con el email y la contraseña de tu cuenta.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" autoFocus autoComplete="username"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
        />
        <input
          type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="Contraseña" autoComplete="current-password"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60">
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link href="/recuperar" className="text-[var(--pc)] hover:underline">¿Olvidaste tu contraseña?</Link>
        <Link href="/crear-tienda" className="text-neutral-500 hover:underline">Crear cuenta</Link>
      </div>
    </div>
  );
}
