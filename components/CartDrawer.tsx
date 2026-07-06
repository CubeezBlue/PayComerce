"use client";

import { formatPrice } from "@/lib/format";
import { useCart } from "./CartContext";

export default function CartDrawer({ currency }: { currency: string }) {
  const { lines, subtotal, count, inc, dec, atMax, cartOpen, setCartOpen, setCheckoutOpen, storeOpen, nextOpen } = useCart();
  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setCartOpen(false)}>
      <div className="flex h-full w-full max-w-md flex-col bg-white text-neutral-900" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-lg font-bold">Tu pedido</h2>
          <button onClick={() => setCartOpen(false)} className="text-2xl leading-none text-neutral-400 hover:text-neutral-700">×</button>
        </header>

        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-neutral-400">
            <span className="text-5xl">🛒</span>
            <p>Tu carrito está vacío</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {lines.map((l) => (
              <div key={l.key} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3">
                <div className="flex-1">
                  <p className="font-medium leading-tight">{l.name}</p>
                  {l.options && <p className="text-xs text-neutral-400">{l.options}</p>}
                  <p className="text-sm text-neutral-500">{formatPrice(l.price, currency)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-black/5">
                  <button onClick={() => dec(l.key)} className="grid h-6 w-6 place-items-center text-lg font-bold text-[var(--brand)]">−</button>
                  <span className="min-w-4 text-center text-sm font-bold">{l.qty}</span>
                  <button onClick={() => inc(l.key)} disabled={atMax(l.key)} className="grid h-6 w-6 place-items-center text-lg font-bold text-[var(--brand)] disabled:opacity-30">+</button>
                </div>
                <span className="w-20 text-right text-sm font-semibold">{formatPrice(l.price * l.qty, currency)}</span>
              </div>
            ))}
          </div>
        )}

        {count > 0 && (
          <footer className="space-y-3 border-t border-neutral-100 px-5 py-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Subtotal</span><span>{formatPrice(subtotal, currency)}</span>
            </div>
            {!storeOpen && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-600">
                🔒 Cerrado ahora{nextOpen ? ` · abrimos ${nextOpen}` : ""}
              </p>
            )}
            <button
              disabled={!storeOpen}
              onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
              className="w-full rounded-full bg-[var(--brand)] py-3 font-semibold text-[var(--brand-text)] shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {storeOpen ? "Continuar" : "Cerrado"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
