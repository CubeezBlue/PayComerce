"use client";

import { useEffect, useMemo, useState } from "react";
import { Category, StoreProduct, Branch } from "@/lib/types";
import ProductCard from "./ProductCard";
import ProductCustomize from "./ProductCustomize";
import { useCart } from "./CartContext";

export default function Menu({
  categories,
  products,
  branches,
  currency,
}: {
  categories: Category[];
  products: StoreProduct[];
  branches: Branch[];
  currency: string;
}) {
  const { qtyOf, addSimple, dec, branchId, setBranchModalOpen, hydrated, storeOpen, nextOpen } = useCart();
  const [query, setQuery] = useState("");
  const [customizing, setCustomizing] = useState<StoreProduct | null>(null);
  const [activeCat, setActiveCat] = useState<number | "all">("all");

  const multiBranch = branches.length > 1;
  // Con una sola sucursal se usa esa; con varias, la elegida.
  const effectiveBranch = multiBranch ? branchId : branches[0]?.id ?? null;

  // Si hay varias sucursales y todavía no eligió, pedimos que elija (solo tras hidratar).
  useEffect(() => {
    if (hydrated && multiBranch && branchId === null) setBranchModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, multiBranch, branchId]);

  const catLabel = useMemo(() => new Map(categories.map((c) => [c.id, `${c.emoji ? c.emoji + " " : ""}${c.name}`])), [categories]);
  const branchName = branches.find((b) => b.id === effectiveBranch)?.name;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        // Disponible en la sucursal elegida
        if (effectiveBranch !== null && !p.branches.some((b) => b.branch_id === effectiveBranch)) return false;
        if (activeCat !== "all" && p.category_id !== activeCat) return false;
        if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((p) => {
        // El stock que ve el cliente es el de su sucursal
        const bs = p.branches.find((b) => b.branch_id === effectiveBranch);
        return { ...p, stock: bs ? bs.stock : p.stock };
      });
  }, [products, query, activeCat, effectiveBranch]);

  const grouped = useMemo(() => {
    const map = new Map<number | "none", StoreProduct[]>();
    for (const p of filtered) {
      const key = p.category_id ?? "none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      {!storeOpen && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <span className="text-lg">🔒</span>
          <span>Ahora estamos <b>cerrados</b>. Podés mirar el menú{nextOpen ? `, abrimos ${nextOpen}` : ""}.</span>
        </div>
      )}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--c-title)]">Nuestro menú</h1>
          {multiBranch && branchName && (
            <button onClick={() => setBranchModalOpen(true)} className="mt-1 text-sm text-[var(--c-muted)] underline">
              📍 Sucursal {branchName} — cambiar
            </button>
          )}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar producto…"
          className="w-full rounded-full border border-black/10 bg-[var(--c-card)] px-4 py-2.5 text-sm text-[var(--c-card-text)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 sm:w-64"
        />
      </div>

      <div className="sticky top-[104px] z-20 -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 py-2 backdrop-blur md:top-[57px]" style={{ background: "color-mix(in srgb, var(--c-bg) 90%, transparent)" }}>
        <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")}>Todo</Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
            {c.emoji ? `${c.emoji} ` : ""}{c.name}
          </Chip>
        ))}
      </div>

      {grouped.length === 0 && <p className="py-12 text-center opacity-50">No encontramos productos en esta sucursal.</p>}

      {grouped.map(([key, items]) => (
        <div key={String(key)} className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-[var(--c-title)]">
            {key === "none" ? "Otros" : catLabel.get(key as number)}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                category={p.category_id ? catLabel.get(p.category_id) : undefined}
                currency={currency}
                qty={qtyOf(p.id)}
                hasOptions={p.optionGroups.length > 0}
                onCustomize={() => setCustomizing(p)}
                onAdd={() => addSimple({ id: p.id, name: p.name, price: p.price, maxStock: p.stock })}
                onRemove={() => dec(`p${p.id}`)}
              />
            ))}
          </div>
        </div>
      ))}

      {customizing && (
        <ProductCustomize product={customizing} currency={currency} onClose={() => setCustomizing(null)} />
      )}
    </section>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm" : "bg-[var(--c-card)] text-[var(--c-card-text)] ring-1 ring-black/5 hover:ring-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}
