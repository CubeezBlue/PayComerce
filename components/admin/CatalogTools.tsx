"use client";

import { useRef, useState } from "react";

type ImportResult = {
  created: number;
  updated: number;
  deleted: number;
  categoriesCreated: number;
  errors: string[];
};

export default function CatalogTools() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setUploading(true);
    setResult(null);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/catalog/import", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { setError((await res.json()).error || "Error al importar"); return; }
    setResult(await res.json());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Carga masiva por Excel</h1>
        <p className="text-neutral-500">Sin límites de plan. Exportá, editá en Excel y volvé a importar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Export */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="text-3xl">📤</div>
          <h2 className="mt-2 font-bold">Exportar catálogo</h2>
          <p className="mt-1 text-sm text-neutral-500">Descargá todos tus productos en un Excel listo para editar.</p>
          <a href="/api/catalog/export" className="mt-4 inline-block rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm">
            Descargar Excel
          </a>
        </div>

        {/* Import */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="text-3xl">📥</div>
          <h2 className="mt-2 font-bold">Importar catálogo</h2>
          <p className="mt-1 text-sm text-neutral-500">Subí un Excel para crear o actualizar productos en lote.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-4 inline-block rounded-full border border-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[var(--brand)] disabled:opacity-60"
          >
            {uploading ? "Importando…" : "Elegir archivo"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{error}</p>}

      {result && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="font-bold">Resultado de la importación</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat n={result.created} label="Creados" />
            <Stat n={result.updated} label="Actualizados" />
            <Stat n={result.deleted} label="Eliminados" />
            <Stat n={result.categoriesCreated} label="Categorías nuevas" />
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700 ring-1 ring-amber-200">
              <p className="font-semibold">Avisos:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Ayuda de formato */}
      <div className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-600 ring-1 ring-black/5">
        <p className="font-semibold text-neutral-800">Formato de la planilla</p>
        <p className="mt-2">Columnas: <code className="rounded bg-white px-1">ID</code> (vacío = nuevo), <code className="rounded bg-white px-1">Categoria</code>, <code className="rounded bg-white px-1">Nombre</code>, <code className="rounded bg-white px-1">Descripcion</code>, <code className="rounded bg-white px-1">Precio</code>, <code className="rounded bg-white px-1">Stock</code>, <code className="rounded bg-white px-1">Activo</code> (SI/NO), <code className="rounded bg-white px-1">Imagen</code>, <code className="rounded bg-white px-1">Eliminar</code> (SI para borrar).</p>
        <ul className="mt-2 list-inside list-disc text-neutral-500">
          <li>Si la categoría no existe, se crea automáticamente.</li>
          <li>Para borrar un producto, poné <b>SI</b> en la columna Eliminar (con su ID).</li>
          <li>Lo más fácil: exportá primero para tener la plantilla con tus datos.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 text-center">
      <p className="text-2xl font-bold text-[var(--brand)]">{n}</p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
