"use client";

import { useState } from "react";

// Pausar / eliminar la tienda. Va en Configuración.
export default function StoreControls({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);
  const [pauseBusy, setPauseBusy] = useState(false);

  async function togglePause() {
    setPauseBusy(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !paused }),
    });
    setPauseBusy(false);
    if (res.ok) setPaused((p) => !p);
  }

  async function deleteStore() {
    if (!confirm("¿Eliminar tu tienda DEFINITIVAMENTE? Se borran todos tus productos, pedidos y datos. Esta acción NO se puede deshacer.")) return;
    if (!confirm("Confirmá de nuevo: esto es irreversible y perdés todo.")) return;
    const res = await fetch("/api/store", { method: "DELETE" });
    if (res.ok) window.location.href = "/precios";
    else alert((await res.json()).error || "No se pudo eliminar");
  }

  return (
    <>
      {/* Pausar la tienda */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Pausar la tienda</h2>
            <p className="text-sm text-neutral-500">
              {paused
                ? "Tu tienda está EN PAUSA: los clientes ven un aviso y no pueden pedir. Vos seguís entrando al panel normalmente."
                : "Poné la tienda en pausa mientras actualizás productos o precios. Los clientes ven un aviso y no pueden hacer pedidos; el panel te sigue funcionando."}
            </p>
          </div>
          <button
            onClick={togglePause}
            disabled={pauseBusy}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${paused ? "bg-green-600" : "bg-amber-500"}`}
          >
            {pauseBusy ? "…" : paused ? "Reactivar tienda" : "Pausar tienda"}
          </button>
        </div>
        {paused && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200">⏸️ Tienda en pausa</p>}
      </div>

      {/* Zona de peligro */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-5">
        <h2 className="font-bold text-red-700">Zona de peligro</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Al eliminar tu tienda se borran <b>todos</b> tus productos, pedidos y datos, y se libera la dirección. Esta acción es <b>irreversible</b>. Si solo querés dejar de vender un tiempo, usá <b>Pausar</b>.
        </p>
        <button onClick={deleteStore} className="mt-4 rounded-full border-2 border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
          Eliminar mi tienda
        </button>
      </div>
    </>
  );
}
