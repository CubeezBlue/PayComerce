"use client";

import { Branch } from "@/lib/types";
import { useCart } from "./CartContext";

export default function BranchModal({ branches }: { branches: Branch[] }) {
  const { branchId, setBranchId, branchModalOpen, setBranchModalOpen, count, clear } = useCart();
  if (!branchModalOpen) return null;

  const mustChoose = branchId === null; // primera vez: no se puede cerrar sin elegir

  function choose(b: Branch) {
    if (branchId !== null && branchId !== b.id && count > 0) {
      if (!confirm("Al cambiar de sucursal se vacía el carrito (el menú puede ser distinto). ¿Continuar?")) return;
      clear();
    }
    setBranchId(b.id);
    setBranchModalOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={() => !mustChoose && setBranchModalOpen(false)}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 text-neutral-900 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">¿A qué sucursal pedís?</h2>
          {!mustChoose && (
            <button onClick={() => setBranchModalOpen(false)} className="text-2xl leading-none text-neutral-400 hover:text-neutral-700">×</button>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-500">Cada sucursal tiene su propio menú y stock.</p>

        <div className="mt-4 space-y-2">
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => choose(b)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                branchId === b.id ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand)]/10 text-lg">📍</span>
              <span>
                <span className="block font-semibold text-neutral-900">{b.name}</span>
                {b.address && <span className="block text-sm text-neutral-500">{b.address}</span>}
              </span>
              {branchId === b.id && <span className="ml-auto text-[var(--brand)]">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
