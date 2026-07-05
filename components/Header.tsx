"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import { Branch } from "@/lib/types";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/menu", label: "Menú" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header({
  storeName,
  logoUrl,
  branches,
}: {
  storeName: string;
  logoUrl?: string;
  branches: Branch[];
}) {
  const { count, setCartOpen, branchId, setBranchModalOpen, storeOpen } = useCart();
  const pathname = usePathname();
  const currentBranch = branches.find((b) => b.id === branchId);
  const showBranch = branches.length > 1;

  return (
    <header
      className="sticky top-0 z-30 border-b border-black/5 backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--c-header) 92%, transparent)", color: "var(--c-header-text)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-9 w-9 rounded-xl object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--brand)] text-lg font-black text-[var(--brand-text)]">
              {storeName.charAt(0)}
            </span>
          )}
          <span className="text-lg font-bold tracking-tight">{storeName}</span>
          <span className={`ml-1 hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${storeOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {storeOpen ? "Abierto" : "Cerrado"}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={active ? "font-semibold text-[var(--accent-on-header)]" : "opacity-70 transition hover:opacity-100"}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showBranch && (
            <button
              onClick={() => setBranchModalOpen(true)}
              className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold sm:flex"
              title="Cambiar sucursal"
            >
              📍 {currentBranch ? currentBranch.name : "Elegí sucursal"} <span className="opacity-50">▾</span>
            </button>
          )}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] shadow-sm"
          >
            🛒 <span className="hidden sm:inline">Carrito</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-neutral-900 text-xs text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Nav mobile */}
      <nav className="flex items-center justify-around border-t border-black/5 py-2 text-xs font-medium md:hidden">
        {NAV.map((n) => {
          const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={active ? "text-[var(--brand)]" : "opacity-70"}>
              {n.label}
            </Link>
          );
        })}
        {showBranch && (
          <button onClick={() => setBranchModalOpen(true)} className="text-xs font-semibold text-[var(--accent-on-header)]">
            📍 {currentBranch ? currentBranch.name : "Sucursal"}
          </button>
        )}
      </nav>
    </header>
  );
}
