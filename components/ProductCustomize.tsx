"use client";

import { useMemo, useState } from "react";
import { StoreProduct } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartContext";

export default function ProductCustomize({
  product,
  currency,
  onClose,
}: {
  product: StoreProduct;
  currency: string;
  onClose: () => void;
}) {
  const { addLine, setCartOpen } = useCart();
  const [selected, setSelected] = useState<Record<number, number[]>>({}); // groupId -> optionIds
  const [qty, setQty] = useState(1);

  function toggle(groupId: number, optionId: number, max: number) {
    setSelected((s) => {
      const cur = s[groupId] ?? [];
      if (cur.includes(optionId)) return { ...s, [groupId]: cur.filter((x) => x !== optionId) };
      if (max === 1) return { ...s, [groupId]: [optionId] }; // radio
      if (cur.length >= max) return s; // límite alcanzado
      return { ...s, [groupId]: [...cur, optionId] };
    });
  }

  const { unitPrice, labels, valid, missing } = useMemo(() => {
    let price = product.price;
    const labels: string[] = [];
    let valid = true;
    const missing: string[] = [];
    for (const g of product.optionGroups) {
      const sel = selected[g.id] ?? [];
      if (sel.length < g.min_select) { valid = false; missing.push(g.name); }
      for (const oid of sel) {
        const opt = g.options.find((o) => o.id === oid);
        if (opt) {
          price += opt.price;
          labels.push(opt.price > 0 ? `${opt.name} (+${formatPrice(opt.price, currency)})` : opt.name);
        }
      }
    }
    return { unitPrice: price, labels, valid, missing };
  }, [selected, product, currency]);

  function add() {
    if (!valid) return;
    const optionIds = Object.values(selected).flat().sort((a, b) => a - b);
    addLine(
      {
        key: `p${product.id}:${optionIds.join(",")}`,
        productId: product.id,
        name: product.name,
        price: unitPrice,
        options: labels.join(", "),
      },
      qty
    );
    onClose();
    setCartOpen(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">{product.name}</h2>
            {product.description && <p className="text-sm text-neutral-500">{product.description}</p>}
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-neutral-400 hover:text-neutral-700">×</button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {product.optionGroups.map((g) => {
            const isRadio = g.max_select === 1;
            const sel = selected[g.id] ?? [];
            return (
              <div key={g.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{g.name}</span>
                  <span className="text-xs text-neutral-400">
                    {g.min_select > 0 ? "Obligatorio" : "Opcional"}
                    {g.max_select > 1 ? ` · hasta ${g.max_select}` : ""}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {g.options.map((o) => {
                    const on = sel.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        onClick={() => toggle(g.id, o.id, g.max_select)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                          on ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`grid h-4 w-4 place-items-center ${isRadio ? "rounded-full" : "rounded"} border ${on ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-text)]" : "border-neutral-300"}`}>
                            {on && <span className="text-[10px]">✓</span>}
                          </span>
                          {o.name}
                        </span>
                        {o.price > 0 && <span className="text-neutral-500">+{formatPrice(o.price, currency)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="space-y-3 border-t border-neutral-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 rounded-full bg-neutral-100 px-2 py-1">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-7 w-7 place-items-center text-lg font-bold">−</button>
              <span className="min-w-4 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-7 w-7 place-items-center text-lg font-bold">+</button>
            </div>
            <button
              onClick={add}
              disabled={!valid}
              className="flex-1 rounded-full bg-[var(--brand)] py-3 font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              Agregar · {formatPrice(unitPrice * qty, currency)}
            </button>
          </div>
          {!valid && <p className="text-center text-xs text-red-500">Elegí: {missing.join(", ")}</p>}
        </footer>
      </div>
    </div>
  );
}
