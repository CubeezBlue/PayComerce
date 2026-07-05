"use client";

import { useRef, useState } from "react";

export default function ImageUpload({
  label,
  value,
  onChange,
  hint,
  aspect = "square",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  aspect?: "square" | "wide";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handle(file: File) {
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) { setError((await res.json()).error || "Error al subir"); return; }
    onChange((await res.json()).url);
  }

  const box = aspect === "wide" ? "h-28 w-full" : "h-24 w-24";

  return (
    <div>
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        <div className={`${box} overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5`}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl text-neutral-300">🖼️</div>
          )}
        </div>
        <div className="space-y-2">
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] disabled:opacity-60"
          >
            {busy ? "Subiendo…" : value ? "Cambiar" : "Subir imagen"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")} className="ml-2 text-sm text-neutral-400 hover:text-red-500">
              Quitar
            </button>
          )}
          {hint && <p className="text-xs text-neutral-400">{hint}</p>}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
