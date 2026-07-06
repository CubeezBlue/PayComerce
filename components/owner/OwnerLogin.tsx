"use client";

import { useState } from "react";

export default function OwnerLogin({ configured }: { configured: boolean }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await fetch("/api/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Error"); return; }
    window.location.reload();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4f46e5] text-lg font-black text-white">P</span>
        <div>
          <p className="font-bold leading-none">PayComerce</p>
          <p className="text-xs text-neutral-400">Panel de dueño</p>
        </div>
      </div>
      <h1 className="text-2xl font-bold">Acceso de dueño</h1>
      <p className="mt-1 text-sm text-neutral-500">Para ver y gestionar todas las tiendas de la plataforma.</p>

      {!configured ? (
        <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          El panel no está habilitado. Configurá la variable de entorno <code className="rounded bg-white px-1">OWNER_PASSWORD</code> en el servidor y volvé a intentar.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Contraseña de dueño"
            autoFocus
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[#4f46e5]"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-full bg-[#4f46e5] py-3 font-semibold text-white shadow-sm disabled:opacity-60">
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
