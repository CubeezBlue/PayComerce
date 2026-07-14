import { NextRequest, NextResponse } from "next/server";
import { openCart, getOpenCart, listCartItems, addCartItem, setCartItemQty, setCartWaiter, moveCart, closeCart, sendTableToKitchen, getSettings } from "@/lib/db";
import { hasAddon } from "@/lib/plans";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";
import { log } from "@/lib/log";

// Ítems de la cuenta abierta de una mesa.
export async function GET(req: NextRequest) {
  const err = await guardAddonPerm(req, "mesas", "mesas");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const tableId = Number(req.nextUrl.searchParams.get("table"));
  const cart = getOpenCart(tableId, db);
  return NextResponse.json({ cart, items: cart ? listCartItems(cart.id, db) : [] });
}

// Acciones sobre la cuenta: open | add | qty | waiter | move | close.
export async function POST(req: NextRequest) {
  const err = await guardAddonPerm(req, "mesas", "mesas");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const b = await req.json();
  const action = String(b.action ?? "");

  switch (action) {
    case "open": {
      const cartId = openCart(Number(b.table_id), String(b.waiter ?? "").trim(), db);
      return NextResponse.json({ cart_id: cartId, items: listCartItems(cartId, db) });
    }
    case "add": {
      const cartId = openCart(Number(b.table_id), String(b.waiter ?? "").trim(), db);
      addCartItem(cartId, {
        product_id: b.product_id != null ? Number(b.product_id) : null,
        name: String(b.name ?? "").trim(), qty: Number(b.qty) || 1, price: Number(b.price) || 0,
      }, db);
      return NextResponse.json({ cart_id: cartId, items: listCartItems(cartId, db) });
    }
    case "qty": {
      setCartItemQty(Number(b.item_id), Number(b.qty), db);
      return NextResponse.json({ items: listCartItems(Number(b.cart_id), db) });
    }
    case "waiter": {
      setCartWaiter(Number(b.cart_id), String(b.waiter ?? "").trim(), db);
      return NextResponse.json({ ok: true });
    }
    case "move": {
      moveCart(Number(b.cart_id), Number(b.to_table_id), db);
      return NextResponse.json({ ok: true });
    }
    case "kitchen": {
      // "Marchar" a cocina los ítems no enviados (requiere el adicional Cocina).
      const settings = getSettings(db);
      if (!hasAddon(settings, "cocina")) return NextResponse.json({ error: "El adicional de Cocina no está activo" }, { status: 403 });
      const ticketId = sendTableToKitchen(Number(b.table_id), Number(settings.kds_prep_minutes) || 15, db);
      if (!ticketId) return NextResponse.json({ error: "No hay consumos nuevos para enviar a cocina" }, { status: 400 });
      log.info("cocina: comanda marchada desde mesa", { slug: slugFromReq(req), tableId: Number(b.table_id), ticketId });
      return NextResponse.json({ ticket_id: ticketId, items: listCartItems(openCart(Number(b.table_id), "", db), db) });
    }
    case "close": {
      const orderId = closeCart(Number(b.cart_id), String(b.payment ?? "cash"), db);
      if (!orderId) return NextResponse.json({ error: "La cuenta está vacía o ya se cerró" }, { status: 400 });
      log.info("mesas: cuenta cobrada", { slug: slugFromReq(req), cartId: Number(b.cart_id), orderId, payment: b.payment });
      return NextResponse.json({ order_id: orderId });
    }
    default:
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }
}
