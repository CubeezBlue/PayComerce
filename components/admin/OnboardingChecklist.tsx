"use client";

import { useState } from "react";
import Link from "next/link";

export type OnboardStep = { key: string; label: string; hint: string; done: boolean; href: string; icon: string };

export default function OnboardingChecklist({ steps, storeName }: { steps: OnboardStep[]; storeName: string }) {
  const [hidden, setHidden] = useState(false);
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  // Si ya está todo listo o el usuario lo cerró, no molestamos.
  if (hidden || allDone) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--brand)]/20 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 bg-[var(--brand)]/10 px-5 py-4">
        <div>
          <p className="font-bold">🚀 Primeros pasos con {storeName}</p>
          <p className="text-sm text-neutral-600">Completá esto para dejar tu tienda lista para vender.</p>
        </div>
        <button onClick={() => setHidden(true)} className="text-sm text-neutral-400 hover:text-neutral-700" aria-label="Ocultar">
          Ocultar
        </button>
      </div>

      {/* Barra de progreso */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{doneCount} de {steps.length} listos</span>
          <span>{Math.round((doneCount / steps.length) * 100)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>

      <ul className="divide-y divide-neutral-100 px-2 py-2">
        {steps.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-neutral-50">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${
                  s.done ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {s.done ? "✓" : s.icon}
              </span>
              <span className="flex-1">
                <span className={`block text-sm font-medium ${s.done ? "text-neutral-400 line-through" : "text-neutral-800"}`}>{s.label}</span>
                {!s.done && <span className="block text-xs text-neutral-400">{s.hint}</span>}
              </span>
              {!s.done && <span className="text-sm text-[var(--brand)]">Configurar →</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
