"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { PALETTE_ROLES, DEFAULT_PALETTE, SUGGESTED_COLORS, PRESET_PALETTES } from "@/lib/palettes";
import { resolveTheme } from "@/lib/theme";
import { RUBROS, parseFeatures, Feature } from "@/lib/rubros";
import { parseWeek, WeekHours, DAY_NAMES } from "@/lib/hours";

type Settings = Record<string, string>;

const FIELDS: { key: string; label: string; type?: string; hint?: string }[] = [
  { key: "store_name", label: "Nombre de la tienda" },
  { key: "tagline", label: "Frase principal (hero)" },
  { key: "hero_subtitle", label: "Subtítulo del hero" },
  { key: "about_text", label: "Texto de Nosotros", type: "textarea" },
  { key: "whatsapp_number", label: "WhatsApp (con código país)", hint: "Ej: 5493510000000" },
  { key: "address", label: "Dirección" },
  { key: "map_query", label: "Ubicación para el mapa", hint: "Dirección o coordenadas" },
  { key: "hours", label: "Horario" },
  { key: "instagram", label: "Instagram (usuario)" },
  { key: "email", label: "Email" },
  { key: "currency", label: "Símbolo de moneda" },
  { key: "delivery_cost", label: "Costo de envío", type: "number" },
];

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [values, setValues] = useState<Settings>({
    online_payment: "1",
    ...DEFAULT_PALETTE,
    ...initial,
  });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [features, setFeatures] = useState<Feature[]>(parseFeatures(initial.about_features));
  const [week, setWeek] = useState<WeekHours>(parseWeek(initial.hours_json));

  function patchDay(day: string, patch: Partial<WeekHours[string]>) {
    setWeek((w) => ({ ...w, [day]: { ...w[day], ...patch } }));
    setSaved(false);
  }

  function set(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    setSaved(false);
  }

  function setFeature(i: number, patch: Partial<Feature>) {
    setFeatures((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
    setSaved(false);
  }

  // Al elegir un rubro se regeneran los textos y valores por defecto (editables después)
  function applyRubro(key: string) {
    const r = RUBROS.find((x) => x.key === key);
    if (!r) return;
    setValues((s) => ({
      ...s,
      business_type: r.key,
      tagline: r.tagline,
      hero_subtitle: r.hero_subtitle,
      about_text: r.about_text,
    }));
    setFeatures(r.features.map((f) => ({ ...f })));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, about_features: JSON.stringify(features), hours_json: JSON.stringify(week) }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-neutral-500">Marca, contacto y opciones de la tienda.</p>
      </div>

      {/* Rubro del negocio */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Rubro del negocio</h2>
        <p className="text-sm text-neutral-500">Elegí tu rubro y generamos los textos y la sección “Nosotros”. Después podés editar todo.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {RUBROS.map((r) => {
            const active = (values.business_type || "restaurante") === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => applyRubro(r.key)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                  active ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                <span className="text-base">{r.emoji}</span> {r.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Marca */}
      <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Identidad</h2>

        {/* Paleta única editable: 3 colores por rol (los textos se calculan solos) */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-neutral-700">Paleta de la tienda</span>
              <p className="text-xs text-neutral-400">Tocá un color para editarlo. Los colores de texto se ajustan solos para que siempre se lean.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setValues((s) => ({ ...s, ...DEFAULT_PALETTE }));
                setSaved(false);
              }}
              className="text-xs font-semibold text-neutral-400 underline hover:text-neutral-600"
            >
              Restaurar original
            </button>
          </div>

          {/* Presets rápidos */}
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_PALETTES.map((p) => {
              const active = PALETTE_ROLES.every((r) => (values[r.key] || "").toLowerCase() === p.colors[r.key].toLowerCase());
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => { setValues((s) => ({ ...s, ...p.colors })); setSaved(false); }}
                  className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                    active ? "border-neutral-800 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                  }`}
                  title={p.name}
                >
                  <span className="flex overflow-hidden rounded-full ring-1 ring-black/10">
                    {PALETTE_ROLES.map((r) => (
                      <span key={r.key} className="h-4 w-4" style={{ background: p.colors[r.key] }} />
                    ))}
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Tira estilo coolors */}
          <div className="mt-3 flex overflow-hidden rounded-2xl ring-1 ring-black/10">
            {PALETTE_ROLES.map((role) => {
              const color = values[role.key] || DEFAULT_PALETTE[role.key];
              const selected = editingRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setEditingRole(selected ? null : role.key)}
                  className={`group relative h-28 flex-1 transition-all ${selected ? "flex-[1.6]" : ""}`}
                  style={{ background: color }}
                  title={`${role.name}: ${role.description}`}
                >
                  <span
                    className={`absolute inset-x-0 bottom-0 px-2 py-1.5 text-center text-[11px] font-semibold ${
                      isLight(color) ? "text-neutral-800" : "text-white"
                    }`}
                  >
                    {role.name}
                    <span className="block font-normal opacity-70">{color.toUpperCase()}</span>
                  </span>
                  {selected && (
                    <span className={`absolute right-2 top-2 text-sm ${isLight(color) ? "text-neutral-800" : "text-white"}`}>✏️</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor del color seleccionado */}
          {editingRole && (
            <div className="mt-3 rounded-2xl bg-neutral-50 p-4 ring-1 ring-black/5">
              {(() => {
                const role = PALETTE_ROLES.find((r) => r.key === editingRole)!;
                const current = values[role.key] || DEFAULT_PALETTE[role.key];
                return (
                  <>
                    <p className="text-sm font-semibold text-neutral-800">
                      {role.name} <span className="font-normal text-neutral-400">— {role.description}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SUGGESTED_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set(role.key, c)}
                          className={`h-8 w-8 rounded-lg ring-2 transition hover:scale-110 ${
                            current.toLowerCase() === c.toLowerCase() ? "ring-neutral-800" : "ring-black/10"
                          }`}
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-neutral-600">
                        Color propio:
                        <input
                          type="color"
                          value={current}
                          onChange={(e) => set(role.key, e.target.value)}
                          className="h-9 w-14 cursor-pointer rounded-lg border border-neutral-200"
                        />
                      </label>
                      <input
                        value={current}
                        onChange={(e) => set(role.key, e.target.value)}
                        className="w-28 rounded-lg border border-neutral-200 px-3 py-1.5 font-mono text-sm outline-none focus:border-neutral-400"
                      />
                      <button type="button" onClick={() => setEditingRole(null)} className="ml-auto text-sm font-semibold text-neutral-500 hover:text-neutral-800">
                        Listo
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Vista previa en vivo con contraste resuelto */}
          {(() => {
            const t = resolveTheme(values);
            return (
              <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-black/10">
                <div className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold" style={{ background: t["--c-header"], color: t["--c-header-text"] }}>
                  <span>{values.store_name || "Tu tienda"}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: t["--brand"], color: t["--brand-text"] }}>Carrito</span>
                </div>
                <div className="px-4 py-4" style={{ background: t["--c-bg"], color: t["--c-text"] }}>
                  <p className="text-base font-bold" style={{ color: t["--c-title"] }}>Título de sección</p>
                  <p className="text-sm opacity-90">Texto de ejemplo sobre el fondo elegido.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: t["--brand"], color: t["--brand-text"] }}>Botón</span>
                    <span className="rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm ring-1 ring-black/5" style={{ color: t["--c-card-text"] }}>
                      Tarjeta · <span style={{ color: t["--accent-ink"] }}>link</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Imágenes de marca */}
        <div className="grid gap-6 sm:grid-cols-3">
          <ImageUpload label="Logo" value={values.logo_url || ""} onChange={(url) => set("logo_url", url)} hint="Cuadrado, PNG con fondo transparente." />
          <ImageUpload label="Imagen del hero (inicio)" value={values.hero_image || ""} onChange={(url) => set("hero_image", url)} aspect="wide" hint="Apaisada, se ve detrás del título." />
          <ImageUpload label="Imagen de Nosotros" value={values.about_image || ""} onChange={(url) => set("about_image", url)} aspect="wide" hint="Foto del local o del equipo." />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={values.online_payment === "1"}
            onChange={(e) => set("online_payment", e.target.checked ? "1" : "0")}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Aceptar pago en línea
        </label>
      </div>

      {/* Cobros con Mercado Pago */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Cobros con Mercado Pago</h2>
        <p className="text-sm text-neutral-500">
          Pegá tu <b>Access Token</b> para cobrar de verdad. Si lo dejás vacío, el pago online funciona en modo demo (sin cobro).
        </p>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-neutral-700">Access Token</span>
          <input
            type="password"
            value={values.mp_access_token ?? ""}
            onChange={(e) => set("mp_access_token", e.target.value)}
            placeholder="APP_USR-… o TEST-…"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-[var(--brand)]"
          />
        </label>
        <p className="mt-2 text-xs text-neutral-400">
          Lo sacás de mercadopago.com.ar → Tu negocio → Credenciales. Usá las de <b>prueba (TEST-…)</b> para testear y las de{" "}
          <b>producción</b> para cobrar en serio. {values.mp_access_token ? "✅ Configurado." : "⚠️ Sin configurar (modo demo)."}
        </p>
      </div>

      {/* Facturación electrónica ARCA */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Facturación electrónica (ARCA/AFIP)</h2>
        <p className="text-sm text-neutral-500">
          Para emitir facturas reales a tus clientes con <b>tu CUIT</b>. Si lo dejás sin configurar, la factura se genera en modo demo (CAE de prueba).
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">CUIT del comercio</span>
            <input
              value={values.afip_cuit ?? ""}
              onChange={(e) => set("afip_cuit", e.target.value)}
              placeholder="20123456789"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Condición frente al IVA</span>
            <select
              value={values.afip_condicion ?? "monotributo"}
              onChange={(e) => set("afip_condicion", e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            >
              <option value="monotributo">Monotributo (Factura C)</option>
              <option value="exento">Exento (Factura C)</option>
              <option value="responsable_inscripto">Responsable Inscripto (Factura A/B)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Punto de venta</span>
            <input
              type="number"
              value={values.afip_punto_venta ?? "1"}
              onChange={(e) => set("afip_punto_venta", e.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Access Token de AfipSDK</span>
            <input
              type="password"
              value={values.afip_access_token ?? ""}
              onChange={(e) => set("afip_access_token", e.target.value)}
              placeholder="token de afipsdk.com"
              className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.afip_production === "1"}
            onChange={(e) => set("afip_production", e.target.checked ? "1" : "")}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Producción (facturas reales). Destildado = homologación (pruebas).
        </label>
        <p className="mt-2 text-xs text-neutral-400">
          El token lo generás gratis en afipsdk.com. Necesitás además el certificado autorizado en ARCA para tu CUIT.{" "}
          {values.afip_access_token && values.afip_cuit ? "✅ Configurado." : "⚠️ Sin configurar (modo demo)."}
        </p>
      </div>

      {/* Campos */}
      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span className="text-sm font-medium text-neutral-700">{f.label}</span>
            {f.type === "textarea" ? (
              <textarea
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
              />
            ) : (
              <input
                type={f.type || "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
              />
            )}
            {f.hint && <span className="mt-1 block text-xs text-neutral-400">{f.hint}</span>}
          </label>
        ))}
      </div>

      {/* Sección Nosotros: 3 tarjetas editables */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Sección “Nosotros”</h2>
        <p className="text-sm text-neutral-500">Los 3 valores que se muestran en la página. Editá el ícono (emoji), el título y el texto.</p>
        <div className="mt-4 space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl bg-neutral-50 p-3 sm:flex-row sm:items-center">
              <input
                value={f.icon}
                onChange={(e) => setFeature(i, { icon: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-center text-lg outline-none focus:border-[var(--brand)] sm:w-16"
                aria-label="Emoji"
              />
              <input
                value={f.title}
                onChange={(e) => setFeature(i, { title: e.target.value })}
                placeholder="Título"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium outline-none focus:border-[var(--brand)] sm:w-56"
              />
              <input
                value={f.text}
                onChange={(e) => setFeature(i, { text: e.target.value })}
                placeholder="Descripción"
                className="w-full flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Horarios de atención */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="font-bold">Horarios de atención</h2>
        <p className="text-sm text-neutral-500">La tienda muestra “Abierto/Cerrado” y bloquea pedidos fuera de horario.</p>
        <div className="mt-4 space-y-2">
          {["1", "2", "3", "4", "5", "6", "0"].map((d) => {
            const cfg = week[d] ?? { open: false, from: "09:00", to: "18:00" };
            return (
              <div key={d} className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 items-center gap-2 text-sm">
                  <input type="checkbox" checked={cfg.open} onChange={(e) => patchDay(d, { open: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
                  <span className="font-medium">{DAY_NAMES[Number(d)]}</span>
                </label>
                {cfg.open ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={cfg.from} onChange={(e) => patchDay(d, { from: e.target.value })} className="rounded-lg border border-neutral-200 px-2 py-1" />
                    <span className="text-neutral-400">a</span>
                    <input type="time" value={cfg.to} onChange={(e) => patchDay(d, { to: e.target.value })} className="rounded-lg border border-neutral-200 px-2 py-1" />
                  </div>
                ) : (
                  <span className="text-sm text-neutral-400">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && <span className="text-sm font-medium text-green-600">✅ Guardado. Recargá la tienda para ver los cambios.</span>}
      </div>
    </div>
  );
}

// Luminancia simple para decidir texto claro u oscuro sobre un swatch
function isLight(hex: string): boolean {
  const h = (hex || "").replace("#", "");
  if (h.length < 6) return true;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
