import { NextRequest, NextResponse } from "next/server";
import { openCart, getOpenCart, listCartItems, addCartItem, setCartItemQty, setCartWaiter, moveCart, closeCart } from "@/lib/db";
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
