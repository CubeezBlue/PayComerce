"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Feature, hasFeature, AddonKey, hasAddon } from "@/lib/plans";
import { Permission } from "@/lib/permissions";

const NAV: { href: string; label: string; icon: string; feature?: Feature; addon?: AddonKey; perm?: Permission; ownerOnly?: boolean }[] = [
  { href: "/admin", label: "Inicio", icon: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾", feature: "orders_board", perm: "pedidos" },
  { href: "/admin/mesas", label: "Mesas", icon: "🍽️", addon: "mesas", perm: "mesas" },
  { href: "/admin/cocina", label: "Cocina", icon: "👨‍🍳", addon: "cocina", perm: "cocina" },
  { href: "/admin/caja", label: "Caja", icon: "💰", addon: "caja", perm: "caja" },
  { href: "/admin/productos", label: "Productos", icon: "📦", perm: "productos" },
  { href: "/admin/sucursales", label: "Sucursales", icon: "📍", feature: "branches", perm: "sucursales" },
  { href: "/admin/envios", label: "Envíos", icon: "🛵", addon: "delivery", perm: "envios" },
  { href: "/admin/precios", label: "Precios", icon: "📈", feature: "price_adjust", perm: "precios" },
  { href: "/admin/catalogo", label: "Excel", icon: "📄", feature: "excel", perm: "precios" },
  { href: "/admin/equipo", label: "Equipo", icon: "👥", addon: "equipos", perm: "config", ownerOnly: true },
  { href: "/admin/plan", label: "Mi plan", icon: "⭐", perm: "config" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️", perm: "config" },
];

export default function AdminShell({
  settings, base = "", permissions = [], actorName = "", isOwner = true, children,
}: {
  settings: Record<string, string>; base?: string; permissions?: Permission[]; actorName?: string; isOwner?: boolean; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const can = (p?: Permission) => !p || isOwner || permissions.includes(p);
  const NAV_ITEMS = NAV.filter(
    (n) => (!n.feature || hasFeature(settings, n.feature)) && (!n.addon || hasAddon(settings, n.addon)) && can(n.perm) && (!n.ownerOnly || isOwner),
  );
  // El middleware reescribe /t/<slug>/admin/... -> /admin/..., comparamos con la ruta limpia
  const clean = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;
  const current = NAV_ITEMS.find((n) => (n.href === "/admin" ? clean === "/admin" : clean.startsWith(n.href)));

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = `${base}/ingresar`;
  }

  // Contenido del panel lateral (se reusa en desktop y en el drawer del celular).
  const sidebarInner = (
    <>
      <div className="flex items-center gap-2 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-lg font-black text-[var(--brand-text)]">P</span>
        <div>
          <p className="text-sm font-bold leading-none">PayComerce</p>
          <p className="text-xs text-neutral-400">{isOwner ? "Panel admin" : `👤 ${actorName}`}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((n) => {
          const active = n.href === "/admin" ? clean === "/admin" : clean.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={`${base}${n.href}`}
              onClick={() => setMenuOpen(false)}
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
        <Link href={base || "/"} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">
          ← Ver la tienda
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">
          ⎋ Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-neutral-100">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">{sidebarInner}</aside>

      {/* Drawer mobile */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 max-w-[80%] flex-col bg-white shadow-xl">{sidebarInner}</aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile: hamburguesa + sección actual */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-xl text-xl ring-1 ring-black/5">
            ☰
          </button>
          <span className="flex-1 truncate font-bold">{current ? `${current.icon} ${current.label}` : "PayComerce"}</span>
          {!isOwner && <span className="truncate text-xs text-neutral-400">👤 {actorName}</span>}
        </div>

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
