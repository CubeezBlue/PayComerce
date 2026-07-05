"use client";

import { CartProvider, useCart } from "./CartContext";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import Checkout from "./Checkout";
import BranchModal from "./BranchModal";
import { formatPrice } from "@/lib/format";
import { resolveTheme } from "@/lib/theme";
import { parseWeek } from "@/lib/hours";
import { Branch } from "@/lib/types";

type Settings = Record<string, string>;

function FloatingBar({ currency }: { currency: string }) {
  const { count, subtotal, cartOpen, checkoutOpen, setCartOpen } = useCart();
  if (count === 0 || cartOpen || checkoutOpen) return null;
  return (
    <button
      onClick={() => setCartOpen(true)}
      className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-full bg-[var(--brand)] px-6 py-4 font-semibold text-[var(--brand-text)] shadow-xl sm:hidden"
    >
      <span>Ver carrito ({count})</span>
      <span>{formatPrice(subtotal, currency)}</span>
    </button>
  );
}

function Overlays({ settings, branches }: { settings: Settings; branches: Branch[] }) {
  const { checkoutOpen } = useCart();
  const currency = settings.currency || "$";
  return (
    <>
      <CartDrawer currency={currency} />
      {checkoutOpen && <Checkout settings={settings} branches={branches} />}
      <BranchModal branches={branches} />
      <FloatingBar currency={currency} />
    </>
  );
}

export default function SiteShell({
  settings,
  branches,
  children,
}: {
  settings: Settings;
  branches: Branch[];
  children: React.ReactNode;
}) {
  const storeName = settings.store_name || "PayComerce";
  const vars = resolveTheme(settings) as React.CSSProperties;

  const week = parseWeek(settings.hours_json);

  return (
    <CartProvider week={week}>
      <div style={{ ...vars, background: "var(--c-bg)", color: "var(--c-text)" }} className="flex min-h-screen flex-col">
        <Header storeName={storeName} logoUrl={settings.logo_url} branches={branches} />
        <main className="flex-1">{children}</main>
        <Footer storeName={storeName} />
        <Overlays settings={settings} branches={branches} />
      </div>
    </CartProvider>
  );
}

function Footer({ storeName }: { storeName: string }) {
  return (
    <footer
      className="border-t border-black/5 py-8 text-center text-sm"
      style={{ background: "var(--c-header)", color: "var(--c-header-text)" }}
    >
      <p className="font-semibold">{storeName}</p>
      <p className="mt-1 opacity-60">Hecho con PayComerce · Tu tienda online, pagos y facturación</p>
      <a href="/admin" className="mt-2 inline-block text-xs underline opacity-50">Panel de administración</a>
    </footer>
  );
}
