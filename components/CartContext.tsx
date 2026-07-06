"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WeekHours, isOpenAt, nextOpenLabel } from "@/lib/hours";

// Una línea del carrito puede ser un producto simple o una combinación con opciones.
// `key` distingue combinaciones distintas del mismo producto.
export type CartLine = {
  key: string;
  productId: number;
  name: string;
  price: number; // precio unitario ya con adicionales
  qty: number;
  options: string; // etiqueta legible: "Grande, + queso" (vacío si no tiene)
  maxStock: number | null; // stock disponible en la sucursal (null = sin límite)
};

type NewLine = Omit<CartLine, "qty">;

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addSimple: (p: { id: number; name: string; price: number; maxStock?: number | null }) => void;
  addLine: (line: NewLine, qty?: number) => void;
  inc: (key: string) => void;
  dec: (key: string) => void;
  atMax: (key: string) => boolean;
  clear: () => void;
  qtyOf: (productId: number) => number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  branchId: number | null;
  setBranchId: (id: number | null) => void;
  branchModalOpen: boolean;
  setBranchModalOpen: (v: boolean) => void;
  hydrated: boolean;
  storeOpen: boolean;
  nextOpen: string;
};

const Ctx = createContext<CartValue | null>(null);
const STORAGE_KEY = "paycomerce_cart";
const BRANCH_KEY = "paycomerce_branch";

export function CartProvider({ week, children }: { week: WeekHours; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [branchId, setBranchIdState] = useState<number | null>(null);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [nowTs, setNowTs] = useState(0); // se setea tras montar para evitar mismatch SSR

  useEffect(() => {
    setNowTs(Date.now());
    const t = setInterval(() => setNowTs(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const storeOpen = nowTs === 0 ? true : isOpenAt(week, new Date(nowTs));
  const nextOpen = nowTs === 0 ? "" : nextOpenLabel(week, new Date(nowTs));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // migración: descartar formato viejo sin `key`
        if (Array.isArray(parsed) && (parsed.length === 0 || parsed[0].key)) setLines(parsed);
      }
      const b = localStorage.getItem(BRANCH_KEY);
      if (b) setBranchIdState(Number(b));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const setBranchId = (id: number | null) => {
    setBranchIdState(id);
    if (id === null) localStorage.removeItem(BRANCH_KEY);
    else localStorage.setItem(BRANCH_KEY, String(id));
  };

  // Tope de unidades para una línea según su stock (null = sin límite).
  const capQty = (q: number, max: number | null | undefined) =>
    max === null || max === undefined ? q : Math.max(0, Math.min(q, max));

  const addLine = (line: NewLine, qty = 1) =>
    setLines((ls) => {
      const found = ls.find((l) => l.key === line.key);
      if (found) {
        // Usamos el stock más reciente (por si cambió de sucursal) y topeamos.
        const max = line.maxStock;
        return ls.map((l) => (l.key === line.key ? { ...l, maxStock: max, qty: capQty(l.qty + qty, max) } : l));
      }
      const capped = capQty(qty, line.maxStock);
      if (capped <= 0) return ls; // sin stock: no agrega
      return [...ls, { ...line, qty: capped }];
    });

  const addSimple: CartValue["addSimple"] = (p) =>
    addLine({ key: `p${p.id}`, productId: p.id, name: p.name, price: p.price, options: "", maxStock: p.maxStock ?? null });

  const inc = (key: string) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, qty: capQty(l.qty + 1, l.maxStock) } : l)));
  const dec = (key: string) =>
    setLines((ls) => ls.flatMap((l) => (l.key === key ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l])));
  const clear = () => setLines([]);
  const qtyOf = (productId: number) => lines.find((l) => l.key === `p${productId}`)?.qty ?? 0;
  const atMax = (key: string) => {
    const l = lines.find((x) => x.key === key);
    return !!l && l.maxStock !== null && l.qty >= l.maxStock;
  };

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const value = useMemo(
    () => ({
      lines, count, subtotal, addSimple, addLine, inc, dec, clear, qtyOf, atMax,
      cartOpen, setCartOpen, checkoutOpen, setCheckoutOpen,
      branchId, setBranchId, branchModalOpen, setBranchModalOpen, hydrated,
      storeOpen, nextOpen,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines, count, subtotal, cartOpen, checkoutOpen, branchId, branchModalOpen, hydrated, storeOpen, nextOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart debe usarse dentro de CartProvider");
  return v;
}
