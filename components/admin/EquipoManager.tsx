"use client";

import { useEffect, useState } from "react";
import { PERMISSIONS, PERMISSION_LABELS, PERMISSION_HINTS, Permission, parsePermissions } from "@/lib/permissions";
import { validatePassword } from "@/lib/validation";

type StaffRow = { id: number; name: string; username: string; permissions: string; active: number; created_at: string };

function PermChecks({ value, onChange }: { value: Permission[]; onChange: (v: Permission[]) => void }) {
  const toggle = (p: Permission) => onChange(value.includes(p) ? value.filter((x) => x !== p) : [...value, p]);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((p) => (
        <label key={p} className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 p-3 text-sm hover:bg-neutral-50">
          <input type="checkbox" checked={value.includes(p)} onChange={() => toggle(p)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
          <span>
            <span className="font-medium text-neutral-800">{PERMISSION_LABELS[p]}</span>
            <span className="block text-xs text-neutral-400">{PERMISSION_HINTS[p]}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

// Editor de permisos con estado local: se marca/desmarca y recién se guarda al tocar el botón.
function StaffPermEditor({ initial, onSave }: { initial: Permission[]; onSave: (v: Permission[]) => Promise<void> | void }) {
  const [val, setVal] = useState<Permission[]>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = [...val].sort().join() !== [...initial].sort().join();
  async function save() {
    setSaving(true);
    await onSave(val);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="mt-3">
      <PermChecks value={val} onChange={(v) => { setVal(v); setSaved(false); }} />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={!dirty || saving} className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-40">
          {saving ? "Guardando…" : "Guardar permisos"}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">✅ Guardado</span>}
        {dirty && !saving && !saved && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
      </div>
    </div>
  );
}

export default function EquipoManager() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Alta
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<Permission[]>(["pedidos"]);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/staff");
    setStaff(r.ok ? await r.json() : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setError("");
    if (!username.trim()) return setError("Poné un usuario");
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    setBusy(true);
    const res = await fetch("/api/staff", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password, permissions: perms }),
    });
    setBusy(false);
    if (!res.ok) return setError((await res.json()).error || "No se pudo crear");
    setName(""); setUsername(""); setPassword(""); setPerms(["pedidos"]);
    load();
  }

  async function patch(id: number, body: Record<string, unknown>) {
    await fetch(`/api/staff/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }
  async function remove(s: StaffRow) {
    if (!confirm(`¿Eliminar al empleado "${s.name || s.username}"? No podrá ingresar más.`)) return;
    await fetch(`/api/staff/${s.id}`, { method: "DELETE" });
    load();
  }
  async function resetPassword(s: StaffRow) {
    const np = prompt(`Nueva contraseña para ${s.username} (mín. 8, con mayúscula, número y símbolo):`);
    if (np == null) return;
    const err = validatePassword(np);
    if (err) { alert(err); return; }
    await patch(s.id, { password: np });
    alert("Contraseña actualizada.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">👥 Equipo</h1>
        <p className="text-neutral-500">Creá usuarios para tus empleados y elegí qué secciones puede ver cada uno. Vos, como dueño, siempre tenés acceso total.</p>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="py-8 text-center text-neutral-400">Cargando…</p>
      ) : staff.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-neutral-400 shadow-sm ring-1 ring-black/5">Todavía no tenés empleados cargados.</p>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => {
            const p = parsePermissions(s.permissions);
            return (
              <div key={s.id} className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${s.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{s.name || s.username} <span className="text-sm font-normal text-neutral-400">@{s.username}</span></p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {p.length ? p.map((x) => PERMISSION_LABELS[x]).join(" · ") : "Sin permisos asignados"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <button onClick={() => patch(s.id, { active: !s.active })} className="text-amber-600 hover:underline">{s.active ? "Desactivar" : "Activar"}</button>
                    <button onClick={() => resetPassword(s)} className="text-neutral-600 hover:underline">Cambiar clave</button>
                    <button onClick={() => remove(s)} className="text-red-500 hover:underline">Eliminar</button>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-[var(--brand)]">Editar permisos</summary>
                  <StaffPermEditor initial={p} onSave={(v) => patch(s.id, { permissions: v })} />
                </details>
              </div>
            );
          })}
        </div>
      )}

      {/* Alta */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Agregar empleado</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block"><span className="text-sm font-medium text-neutral-700">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" /></label>
          <label className="block"><span className="text-sm font-medium text-neutral-700">Usuario</span>
            <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="juan"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" /></label>
          <label className="block"><span className="text-sm font-medium text-neutral-700">Contraseña</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" /></label>
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-700">¿Qué puede ver este empleado?</p>
        <div className="mt-2"><PermChecks value={perms} onChange={setPerms} /></div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button onClick={create} disabled={busy}
          className="mt-4 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
          {busy ? "Creando…" : "Agregar empleado"}
        </button>
      </div>
    </div>
  );
}
