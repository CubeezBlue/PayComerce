import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrders, clearFinalizedOrders, getOrderById, getSettings, saveInvoice, OutOfStockError } from "@/lib/db";
import { createInvoiceForOrder } from "@/lib/afip";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  const db = storeDbFromReq(req);
  const branch = req.nextUrl.searchParams.get("branch");
  const branchId = branch && branch !== "all" ? Number(branch) : null;
  return NextResponse.json(getOrders({ branchId }, db));
}

// Vacía el historial (entregados + cancelados)
export function DELETE(req: NextRequest) {
  const removed = clearFinalizedOrders(storeDbFromReq(req));
  return NextResponse.json({ removed });
}

export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const b = await req.json();
  const items = Array.isArray(b.items) ? b.items : [];
  if (!b.customer_name || items.length === 0)
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });

  let id: number;
  try {
    id = createOrder({
    code: String(b.code ?? ""),
    branch_id: b.branch_id ?? null,
    customer_name: String(b.customer_name ?? ""),
    phone: String(b.phone ?? ""),
    address: String(b.address ?? ""),
    delivery: b.delivery === "delivery" ? "delivery" : "pickup",
    payment: ["online", "cash", "transfer"].includes(b.payment) ? b.payment : "cash",
    notes: String(b.notes ?? ""),
    items: items.map((i: { product_id?: unknown; name?: unknown; qty?: unknown; price?: unknown }) => ({
      product_id: i.product_id != null ? Number(i.product_id) : undefined,
      name: String(i.name ?? ""),
      qty: Number(i.qty ?? 0),
      price: Number(i.price ?? 0),
    })),
    subtotal: Number(b.subtotal ?? 0),
    shipping: Number(b.shipping ?? 0),
    total: Number(b.total ?? 0),
    invoice: !!b.invoice,
    cuit: String(b.cuit ?? ""),
    // Sin MP: online demo = aprobado; transferencia = pendiente (se marca a mano); efectivo = al recibir
    payment_status: b.payment === "online" ? "approved" : b.payment === "transfer" ? "pending" : "offline",
    created_at: new Date().toISOString(),
  }, db);
  } catch (e) {
    if (e instanceof OutOfStockError)
      return NextResponse.json({ error: "Sin stock suficiente", items: e.items }, { status: 409 });
    throw e;
  }

  // Si pidió factura, la emitimos al toque (best-effort; si falla, se puede reintentar del panel)
  let invoice = null;
  if (b.invoice) {
    try {
      const order = getOrderById(id, db);
      if (order) {
        invoice = await createInvoiceForOrder(order, getSettings(db));
        saveInvoice(id, invoice, db);
      }
    } catch {
      /* la factura queda pendiente para reintentar desde el tablero */
    }
  }

  return NextResponse.json({ id, invoice }, { status: 201 });
}
