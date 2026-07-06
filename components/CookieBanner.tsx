"use client";

import { useEffect, useState } from "react";

const KEY = "pc_cookies_ok";

// Banner de cookies. Usamos solo cookies/almacenamiento estrictamente necesarios
// (sesión, tienda actual y carrito), pero informamos y pedimos conformidad.
export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "1") setShow(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 rounded-2xl bg-neutral-900 px-5 py-4 text-sm text-neutral-100 shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 leading-relaxed">
          🍪 Usamos cookies y almacenamiento necesarios para que la tienda funcione (mantener tu sesión y tu carrito).
          No usamos cookies de publicidad.{" "}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Ver Política de Privacidad
          </a>.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-full bg-white px-5 py-2 font-semibold text-neutral-900 hover:bg-neutral-200"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
