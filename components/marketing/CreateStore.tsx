"use client";

import { useState } from "react";
import Link from "next/link";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export default function CreateStore({ baseHost }: { baseHost: string }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touchedSlug, setTouchedSlug] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState<{ slug: string; name: string } | null>(null);

  const effSlug = touchedSlug ? slug : slugify(name);

  async function create() {
    setError("");
    if (!name.trim()) { setError("Poné el nombre de tu negocio"); return; }
    if (password.length < 4) { setError("La contraseña debe tener 4+ caracteres"); return; }
    setCreating(true);
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: effSlug, password }),
    });
    setCreating(false);
    if (!res.ok) { setError((await res.json()).error || "No se pudo crear"); return; }
    setDone({ slug: effSlug, name: name.trim() });
  }

  if (done) {
    const url = `http://${done.slug}.${baseHost}`;
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold">¡Tu tienda está lista!</h1>
        <p className="mt-2 text-neutral-500">Ya podés cargar tus productos y empezar a vender.</p>
        <div className="mt-6 space-y-2 rounded-2xl bg-neutral-50 p-4 text-left text-sm ring-1 ring-black/5">
          <p><span className="text-neutral-400">Tienda:</span> <b>{done.name}</b></p>
          <p className="break-all"><span className="text-neutral-400">Dirección:</span> <b>{done.slug}.{baseHost}</b></p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <a href={`${url}/admin`} className="rounded-full bg-[var(--pc)] px-6 py-3 font-semibold text-white shadow-sm">Ir a mi panel</a>
          <a href={url} className="rounded-full border border-neutral-200 px-6 py-3 font-semibold text-neutral-700">Ver mi tienda</a>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          En local, los subdominios funcionan como <b>{done.slug}.localhost:3000</b>. En producción será tu dominio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Link href="/precios" className="text-sm text-[var(--pc)]">← Volver</Link>
      <h1 className="mt-3 text-3xl font-black">Creá tu tienda</h1>
      <p className="mt-2 text-neutral-500">En un minuto tenés tu tienda online lista para vender.</p>

      <div className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Nombre de tu negocio</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pizzería Don José"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Dirección de tu tienda</span>
          <div className="mt-1 flex items-center overflow-hidden rounded-xl border border-neutral-200 focus-within:border-[var(--pc)]">
            <input
              value={effSlug}
              onChange={(e) => { setTouchedSlug(true); setSlug(slugify(e.target.value)); }}
              placeholder="pizzeria-don-jose"
              className="min-w-0 flex-1 px-4 py-3 outline-none"
            />
            <span className="shrink-0 bg-neutral-100 px-3 py-3 text-sm text-neutral-500">.{baseHost}</span>
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Contraseña del panel</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Para entrar a administrar tu tienda"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:border-[var(--pc)]"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={create}
          disabled={creating}
          className="w-full rounded-full bg-[var(--pc)] py-3 font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {creating ? "Creando…" : "Crear mi tienda gratis"}
        </button>
        <p className="text-center text-xs text-neutral-400">Empezás en el plan Emprendedor. Cambiás cuando quieras.</p>
      </div>
    </div>
  );
}
