"use client";

import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const EMOJI: Record<string, string> = {
  pizza: "🍕", pizzas: "🍕", hamburguesa: "🍔", hamburguesas: "🍔",
  bebida: "🥤", bebidas: "🥤", postre: "🍰", postres: "🍰",
  empanada: "🥟", empanadas: "🥟", ensalada: "🥗", cafe: "☕", café: "☕",
};

function tileFor(name: string, category?: string) {
  const key = (category ?? name).toLowerCase();
  for (const k of Object.keys(EMOJI)) if (key.includes(k)) return EMOJI[k];
  return "🍽️";
}

export default function ProductCard({
  product,
  category,
  currency,
  qty,
  onAdd,
  onRemove,
  hasOptions,
  onCustomize,
}: {
  product: Product;
  category?: string;
  currency: string;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  hasOptions?: boolean;
  onCustomize?: () => void;
}) {
  const soldOut = product.stock !== null && product.stock <= 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-[var(--c-card)] text-[var(--c-card-text)] shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="relative flex h-36 items-center justify-center bg-[var(--brand)]/10 text-5xl">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span>{tileFor(product.name, category)}</span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-neutral-600">
            Sin stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-semibold leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm text-[var(--c-card-muted)]">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold">{formatPrice(product.price, currency)}</span>

          {hasOptions ? (
            <button
              disabled={soldOut}
              onClick={onCustomize}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              Elegir
            </button>
          ) : qty === 0 ? (
            <button
              disabled={soldOut}
              onClick={onAdd}
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              Agregar
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-[var(--brand)] px-2 py-1 text-[var(--brand-text)]">
              <button onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-full text-lg font-bold hover:bg-white/20">−</button>
              <span className="min-w-4 text-center text-sm font-bold">{qty}</span>
              <button onClick={onAdd} disabled={soldOut} className="grid h-7 w-7 place-items-center rounded-full text-lg font-bold hover:bg-white/20 disabled:opacity-40">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
