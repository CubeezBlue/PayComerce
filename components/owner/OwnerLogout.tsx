"use client";

export default function OwnerLogout() {
  return (
    <button
      onClick={async () => { await fetch("/api/owner/logout", { method: "POST" }); window.location.reload(); }}
      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"
    >
      Cerrar sesión
    </button>
  );
}
