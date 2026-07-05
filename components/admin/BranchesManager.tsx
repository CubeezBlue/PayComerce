"use client";

import { useEffect, useState } from "react";
import { Branch } from "@/lib/types";

type Draft = { id?: number; name: string; address: string; whatsapp_number: string; active: boolean };
const empty: Draft = { name: "", address: "", whatsapp_number: "", active: true };

export default function BranchesManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setBranches(await fetch("/api/branches").then((r) => r.json()));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    const res = await fetch(editing.id ? `/api/branches/${editing.id}` : "/api/branches", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name.trim(),
        address: editing.address,
        whatsapp_number: editing.whatsapp_number,
        active: editing.active,
      }),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json()).error || "Error al guardar"); return; }
    setEditing(null);
    setError("");
    load();
  }

  async function remove(b: Branch) {
    if (!confirm(`¿Borrar la sucursal "${b.name}"? Los productos dejarán de estar asignados a ella.`)) return;
    const res = await fetch(`/api/branches/${b.id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Error"); return; }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sucursales</h1>
          <p className="text-neutral-500">Cada sucursal puede tener su propio menú, stock y WhatsApp.</p>
        </div>
        <button onClick={() => { setError(""); setEditing({ ...empty }); }} className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm">
          + Nueva
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-neutral-400">Cargando…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand)]/10 text-lg">📍</span>
                  <div>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-sm text-neutral-500">{b.address || "Sin dirección"}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {b.active ? "Activa" : "Inactiva"}
                </span>
              </div>
              <p className="mt-3 text-sm text-neutral-500">💬 {b.whatsapp_number || "Usa el WhatsApp general"}</p>
              <div className="mt-4 flex gap-3 text-sm">
                <button
                  onClick={() => setEditing({ id: b.id, name: b.name, address: b.address, whatsapp_number: b.whatsapp_number, active: !!b.active })}
                  className="font-semibold text-[var(--brand)] hover:underline"
                >
                  Editar
                </button>
                <button onClick={() => remove(b)} className="text-red-500 hover:underline">Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? "Editar sucursal" : "Nueva sucursal"}</h2>
            <div className="mt-4 space-y-3">
              <Field label="Nombre" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} placeholder="Ej: Centro, Nueva Córdoba…" />
              <Field label="Dirección" value={editing.address} onChange={(v) => setEditing({ ...editing, address: v })} placeholder="Calle y número" />
              <Field label="WhatsApp de la sucursal" value={editing.whatsapp_number} onChange={(v) => setEditing({ ...editing, whatsapp_number: v })} placeholder="Vacío = usa el general" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
                Sucursal activa (visible en la tienda)
              </label>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-600">Cancelar</button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-[var(--brand)] py-2.5 text-sm font-semibold text-[var(--brand-text)] disabled:opacity-60">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
      />
    </label>
  );
}
