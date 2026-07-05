"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feature, hasFeature } from "@/lib/plans";

const NAV: { href: string; label: string; icon: string; feature?: Feature }[] = [
  { href: "/admin", label: "Inicio", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾", feature: "orders_board" },
  { href: "/admin/productos", label: "Productos", icon: "📦" },
  { href: "/admin/sucursales", label: "Sucursales", icon: "📍", feature: "branches" },
  { href: "/admin/precios", label: "Precios", icon: "📈", feature: "price_adjust" },
  { href: "/admin/catalogo", label: "Excel", icon: "📄", feature: "excel" },
  { href: "/admin/plan", label: "Mi plan", icon: "⭐" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

export default function AdminShell({ settings, children }: { settings: Record<string, string>; children: React.ReactNode }) {
  const pathname = usePathname();
  const NAV_ITEMS = NAV.filter((n) => !n.feature || hasFeature(settings, n.feature));

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-lg font-black text-[var(--brand-text)]">P</span>
          <div>
            <p className="text-sm font-bold leading-none">PayComerce</p>
            <p className="text-xs text-neutral-400">Panel admin</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-[var(--brand)] text-[var(--brand-text)] shadow-sm" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-neutral-200 p-3">
          <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">
            ← Ver la tienda
          </Link>
          <button
            onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/ingresar"; }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
          >
            ⎋ Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Topbar mobile */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:hidden">
          {NAV_ITEMS.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-[var(--brand)] text-[var(--brand-text)]" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {n.icon} {n.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
