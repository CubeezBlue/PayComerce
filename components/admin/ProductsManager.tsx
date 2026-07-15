"use client";

import { useEffect, useState } from "react";
import { Category, StoreProduct, Branch } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import ImageUpload from "./ImageUpload";

type BranchDraft = { enabled: boolean; stock: string };
type OptDraft = { name: string; price: string };
type GroupDraft = { name: string; min_select: number; max_select: number; options: OptDraft[] };

type Draft = {
  id?: number;
  category_id: number | null;
  name: string;
  description: string;
  price: string;
  image_url: string;
  active: boolean;
  branches: Record<number, BranchDraft>;
  optionGroups: GroupDraft[];
};

export default function ProductsManager({ canVariants = true, productLimit = null }: { canVariants?: boolean; productLimit?: number | null }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [branchView, setBranchView] = useState<number | "all">("all");

  // Panel de categorías
  const [showCats, setShowCats] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("");
  const [catError, setCatError] = useState("");
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatEmoji, setEditCatEmoji] = useState("");

  async function load() {
    setLoading(true);
    const [p, c, b] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
    ]);
    setProducts(p);
    setCategories(c);
    setBranches(b);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const multiBranch = branches.length > 1;

  // ----- Categorías -----
  async function addCat() {
    setCatError("");
    const name = newCat.trim();
    if (!name) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji: newCatEmoji.trim() }),
    });
    if (!res.ok) { setCatError((await res.json()).error || "Error al crear"); return; }
    setNewCat(""); setNewCatEmoji("");
    load();
  }
  async function saveCat(id: number) {
    if (!editCatName.trim()) return;
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editCatName.trim(), emoji: editCatEmoji.trim() }),
    });
    setEditCatId(null);
    load();
  }
  async function deleteCat(c: Category) {
    if (!confirm(`¿Borrar la categoría "${c.name}"? Los productos quedarán sin categoría.`)) return;
    await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    load();
  }

  // ----- Productos -----
  function openNew() {
    setError("");
    const bd: Record<number, BranchDraft> = {};
    for (const b of branches) {
      // Si estás viendo una sucursal puntual, el nuevo producto arranca habilitado en esa;
      // si estás en "Todas", arranca disponible en todas.
      bd[b.id] = { enabled: branchView === "all" ? true : b.id === branchView, stock: "" };
    }
    setEditing({ category_id: null, name: "", description: "", price: "", image_url: "", active: true, branches: bd, optionGroups: [] });
  }

  function openEdit(p: StoreProduct) {
    setError("");
    const bd: Record<number, BranchDraft> = {};
    for (const b of branches) {
      const row = p.branches.find((x) => x.branch_id === b.id);
      bd[b.id] = { enabled: !!row, stock: row && row.stock !== null ? String(row.stock) : "" };
    }
    setEditing({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      active: !!p.active,
      branches: bd,
      optionGroups: p.optionGroups.map((g) => ({
        name: g.name,
        min_select: g.min_select,
        max_select: g.max_select,
        options: g.options.map((o) => ({ name: o.name, price: String(o.price) })),
      })),
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (editing.price === "" || Number(editing.price) < 0) { setError("Precio inválido"); return; }
    const enabledBranches = Object.entries(editing.branches).filter(([, v]) => v.enabled);
    if (enabledBranches.length === 0) { setError("El producto debe estar disponible en al menos una sucursal"); return; }
    setSaving(true);
    const firstStock = enabledBranches[0][1].stock;
    const body = {
      category_id: editing.category_id,
      name: editing.name.trim(),
      description: editing.description,
      price: Number(editing.price),
      image_url: editing.image_url,
      stock: firstStock === "" ? null : Number(firstStock),
      active: editing.active,
      branches: enabledBranches.map(([id, v]) => ({ branch_id: Number(id), stock: v.stock === "" ? null : Number(v.stock) })),
    };
    const res = await fetch(editing.id ? `/api/products/${editing.id}` : "/api/products", {
      method: editing.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { setSaving(false); setError((await res.json()).error || "Error al guardar"); return; }
    const productId = editing.id ?? (await res.json()).id;

    // Guardar opciones (grupos + items)
    const groups = editing.optionGroups
      .filter((g) => g.name.trim())
      .map((g) => ({
        name: g.name.trim(),
        min_select: g.min_select,
        max_select: g.max_select,
        options: g.options.filter((o) => o.name.trim()).map((o) => ({ name: o.name.trim(), price: Number(o.price) || 0 })),
      }));
    await fetch(`/api/products/${productId}/options`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groups }),
    });

    setSaving(false);
    setEditing(null);
    load();
  }

  // Helpers para editar grupos de opciones en el draft
  function updateGroups(fn: (gs: GroupDraft[]) => GroupDraft[]) {
    setEditing((e) => (e ? { ...e, optionGroups: fn(e.optionGroups) } : e));
  }
  const addGroup = () => updateGroups((gs) => [...gs, { name: "", min_select: 0, max_select: 1, options: [{ name: "", price: "" }] }]);
  const removeGroup = (gi: number) => updateGroups((gs) => gs.filter((_, i) => i !== gi));
  const patchGroup = (gi: number, patch: Partial<GroupDraft>) => updateGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const addOption = (gi: number) => updateGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, options: [...g.options, { name: "", price: "" }] } : g)));
  const removeOption = (gi: number, oi: number) => updateGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g)));
  const patchOption = (gi: number, oi: number, patch: Partial<OptDraft>) =>
    updateGroups((gs) => gs.map((g, i) => (i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g)));

  async function remove(p: StoreProduct) {
    if (!confirm(`¿Borrar "${p.name}"?`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    load();
  }

  // Stock mostrado según la vista de sucursal
  function stockCell(p: StoreProduct) {
    if (branchView !== "all") {
      const row = p.branches.find((b) => b.branch_id === branchView);
      return row ? (row.stock === null ? "∞" : String(row.stock)) : "—";
    }
    if (p.branches.length === 0) return "—";
    if (p.branches.some((b) => b.stock === null)) return "∞";
    return String(p.branches.reduce((s, b) => s + (b.stock ?? 0), 0));
  }

  // Productos filtrados por sucursal + búsqueda
  const visible = products.filter((p) => {
    if (branchView !== "all" && !p.branches.some((b) => b.branch_id === branchView)) return false;
    return p.name.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-neutral-500">
            {branchView === "all" ? `${products.length} en total` : `${visible.length} en esta sucursal`}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar…"
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-[var(--brand)]"
          />
          <button onClick={openNew} className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm">
            + Nuevo
          </button>
        </div>
      </div>

      {/* Selector de sucursal */}
      {multiBranch && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500">Viendo:</span>
          <Chip active={branchView === "all"} onClick={() => setBranchView("all")}>Todas</Chip>
          {branches.map((b) => (
            <Chip key={b.id} active={branchView === b.id} onClick={() => setBranchView(b.id)}>📍 {b.name}</Chip>
          ))}
        </div>
      )}

      {/* Panel de categorías */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <button
          onClick={() => setShowCats((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="font-semibold">Categorías <span className="font-normal text-neutral-400">({categories.length})</span></span>
          <span className="text-neutral-400">{showCats ? "▲" : "▼"}</span>
        </button>
        {showCats && (
          <div className="border-t border-neutral-100 p-5">
            <div className="flex gap-2">
              <input
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                placeholder="🍕"
                className="w-14 rounded-full border border-neutral-200 px-3 py-2 text-center text-lg outline-none focus:border-[var(--brand)]"
                title="Emoji (opcional)"
              />
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCat()}
                placeholder="Nueva categoría…"
                className="min-w-0 flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <button onClick={addCat} className="shrink-0 rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[var(--brand-text)]">Agregar</button>
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">Poné un emoji (tocá el 😀 del teclado) para que la categoría se vea más linda en tu tienda.</p>
            {catError && <p className="mt-2 text-sm text-red-500">{catError}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-full bg-neutral-50 py-1 pl-3 pr-1 ring-1 ring-black/5">
                  {editCatId === c.id ? (
                    <>
                      <input
                        value={editCatEmoji}
                        onChange={(e) => setEditCatEmoji(e.target.value)}
                        className="w-10 rounded border border-neutral-200 px-1 py-0.5 text-center text-base outline-none focus:border-[var(--brand)]"
                        placeholder="🙂"
                        title="Emoji"
                      />
                      <input
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveCat(c.id)}
                        className="w-24 rounded border border-neutral-200 px-2 py-0.5 text-sm outline-none focus:border-[var(--brand)]"
                        autoFocus
                      />
                      <button onClick={() => saveCat(c.id)} className="rounded-full bg-[var(--brand)] px-2 py-1 text-xs font-semibold text-[var(--brand-text)]">OK</button>
                      <button onClick={() => setEditCatId(null)} className="px-1 text-xs text-neutral-400">✕</button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{c.emoji ? `${c.emoji} ` : ""}{c.name}</span>
                      <button onClick={() => { setEditCatId(c.id); setEditCatName(c.name); setEditCatEmoji(c.emoji || ""); }} className="grid h-6 w-6 place-items-center rounded-full text-xs text-neutral-500 hover:bg-neutral-200" title="Editar">✏️</button>
                      <button onClick={() => deleteCat(c)} className="grid h-6 w-6 place-items-center rounded-full text-xs text-red-500 hover:bg-red-50" title="Borrar">🗑️</button>
                    </>
                  )}
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-neutral-400">Sin categorías todavía.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      {loading ? (
        <p className="py-12 text-center text-neutral-400">Cargando…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 text-left text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3 text-center">Stock{branchView !== "all" ? " (suc.)" : ""}</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 text-neutral-300">🍽️</span>
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{p.category_id ? catName.get(p.category_id) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-center text-neutral-500">
                    {stockCell(p)}
                    {multiBranch && branchView === "all" && (
                      <span className="block text-[10px] text-neutral-400">{p.branches.length}/{branches.length} suc.</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                      {p.active ? "Activo" : "Oculto"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-[var(--brand)] hover:underline">Editar</button>
                    <button onClick={() => remove(p)} className="ml-3 text-red-500 hover:underline">Borrar</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-400">Sin productos en esta vista.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal producto */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setEditing(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing.id ? "Editar producto" : "Nuevo producto"}</h2>
            <div className="mt-4 space-y-3">
              <Input label="Nombre" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Textarea label="Descripción" value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
              <Input label="Precio" type="number" value={editing.price} onChange={(v) => setEditing({ ...editing, price: v })} />

              <ImageUpload
                label="Foto del producto"
                value={editing.image_url}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
                aspect="wide"
                hint="Subila desde tu PC o la galería/cámara del celular."
              />

              {/* Disponibilidad y stock por sucursal */}
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-black/5">
                <span className="text-sm font-medium text-neutral-700">
                  {multiBranch ? "Disponibilidad y stock por sucursal" : "Stock"}
                </span>
                <div className="mt-2 space-y-2">
                  {branches.map((b) => {
                    const bd = editing.branches[b.id] ?? { enabled: false, stock: "" };
                    return (
                      <div key={b.id} className="flex items-center gap-3">
                        {multiBranch && (
                          <label className="flex flex-1 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={bd.enabled}
                              onChange={(e) => setEditing({ ...editing, branches: { ...editing.branches, [b.id]: { ...bd, enabled: e.target.checked } } })}
                              className="h-4 w-4 accent-[var(--brand)]"
                            />
                            📍 {b.name}
                          </label>
                        )}
                        <input
                          type="number"
                          placeholder="Stock (vacío = ∞)"
                          value={bd.stock}
                          disabled={multiBranch && !bd.enabled}
                          onChange={(e) => setEditing({ ...editing, branches: { ...editing.branches, [b.id]: { ...bd, enabled: true, stock: e.target.value } } })}
                          className={`rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)] disabled:bg-neutral-100 disabled:text-neutral-300 ${multiBranch ? "w-36" : "w-full"}`}
                        />
                      </div>
                    );
                  })}
                </div>
                {multiBranch && <p className="mt-2 text-xs text-neutral-400">Destildá una sucursal para que el producto no aparezca en su menú.</p>}
              </div>

              <label className="block">
                <span className="text-sm font-medium text-neutral-700">Categoría</span>
                <select
                  value={editing.category_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, category_id: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              {/* Opciones y adicionales (según plan) */}
              {!canVariants ? (
                <div className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-500 ring-1 ring-black/5">
                  🔒 Variantes y adicionales están en el plan <b>Profesional</b>.{" "}
                  <a href="/admin/plan" className="font-semibold text-[var(--brand)] underline">Mejorá tu plan</a>
                </div>
              ) : (
              <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">Opciones y adicionales</span>
                  <button type="button" onClick={addGroup} className="rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-[var(--brand-text)]">+ Grupo</button>
                </div>
                <p className="mt-1 text-xs text-neutral-400">Ej: “Tamaño” (elegí 1) o “Extras” (varios). El precio suma al del producto.</p>

                <div className="mt-3 space-y-3">
                  {editing.optionGroups.map((g, gi) => (
                    <div key={gi} className="rounded-lg bg-white p-3 ring-1 ring-black/5">
                      <div className="flex items-center gap-2">
                        <input
                          value={g.name}
                          onChange={(e) => patchGroup(gi, { name: e.target.value })}
                          placeholder="Nombre del grupo (ej: Tamaño)"
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                        />
                        <button type="button" onClick={() => removeGroup(gi)} className="text-red-500" title="Borrar grupo">🗑️</button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={g.min_select >= 1} onChange={(e) => patchGroup(gi, { min_select: e.target.checked ? 1 : 0 })} className="h-3.5 w-3.5 accent-[var(--brand)]" />
                          Obligatorio
                        </label>
                        <label className="flex items-center gap-1">
                          Máx. a elegir:
                          <input type="number" min={1} value={g.max_select} onChange={(e) => patchGroup(gi, { max_select: Math.max(1, Number(e.target.value) || 1) })} className="w-14 rounded border border-neutral-200 px-2 py-0.5" />
                        </label>
                        <span className="text-neutral-400">{g.max_select === 1 ? "(elige uno)" : "(varios)"}</span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        {g.options.map((o, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              value={o.name}
                              onChange={(e) => patchOption(gi, oi, { name: e.target.value })}
                              placeholder="Opción (ej: Grande)"
                              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-neutral-400">+$</span>
                              <input
                                type="number"
                                value={o.price}
                                onChange={(e) => patchOption(gi, oi, { price: e.target.value })}
                                placeholder="0"
                                className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
                              />
                            </div>
                            <button type="button" onClick={() => removeOption(gi, oi)} className="text-neutral-400 hover:text-red-500">✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addOption(gi)} className="text-xs font-semibold text-[var(--brand)]">+ Agregar opción</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 accent-[var(--brand)]" />
                Visible en la tienda
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm" : "bg-white text-neutral-600 ring-1 ring-black/5 hover:ring-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="mt-1 w-full resize-none rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand)]" />
    </label>
  );
}
