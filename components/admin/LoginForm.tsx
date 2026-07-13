"use client";

import { useState } from "react";
import { validatePassword } from "@/lib/validation";

export default function LoginForm({ storeName, firstTime, base = "" }: { storeName: string; firstTime: boolean; base?: string }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [staffMode, setStaffMode] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (staffMode) {
      if (!username.trim()) { setError("Ingresá tu usuario"); return; }
      if (!pw) { setError("Ingresá tu contraseña"); return; }
    } else if (firstTime) {
      const err = validatePassword(pw);
      if (err) { setError(err); return; }
      if (pw !== pw2) { setError("Las contraseñas no coinciden"); return; }
    } else if (!pw) { setError("Ingresá tu contraseña"); return; }
    setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffMode ? { username: username.trim(), password: pw } : { password: pw }),
    });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Error"); return; }
    window.location.href = `${base}/admin`;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--pc)] text-lg font-black text-white">
          {storeName.charAt(0)}
        </span>
        <div>
          <p className="font-bold leading-none">{storeName}</p>
          <p className="text-xs text-neutral-400">Panel de administración</p>
        </div>
      </div>

      <h1 className="text-2xl font-bold">{firstTime ? "Creá tu contraseña" : staffMode ? "Ingreso de empleados" : "Ingresá a tu panel"}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {firstTime ? "Es la primera vez. Definí una contraseña para proteger tu panel." : staffMode ? "Ingresá con el usuario y contraseña que te dio el dueño." : "Ingresá con tu contraseña de administrador."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        {staffMode && (
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario"
            autoFocus
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        )}
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Contraseña"
          autoFocus={!staffMode}
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
        />
        {firstTime && !staffMode && (
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Repetir contraseña"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {busy ? "Entrando…" : firstTime ? "Crear contraseña y entrar" : "Entrar"}
        </button>
      </form>

      {!firstTime && (
        <button
          onClick={() => { setStaffMode((v) => !v); setError(""); setPw(""); setUsername(""); }}
          className="mt-4 text-sm text-neutral-500 hover:text-[var(--pc)]"
        >
          {staffMode ? "← Soy el dueño" : "Soy empleado →"}
        </button>
      )}
    </div>
  );
}
