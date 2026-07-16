import { NextRequest, NextResponse } from "next/server";
import { getOrderById, getSettings, saveInvoice } from "@/lib/db";
import { createInvoiceForOrder } from "@/lib/afip";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

type Params = { params: Promise<{ id: string }> };

// Emite (o re-emite) la factura del pedido en ARCA.
export async function POST(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("pedidos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const { id } = await params;
  const db = storeDbFromReq(req);
  const order = getOrderById(Number(id), db);
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  if (order.cae) return NextResponse.json({ ok: true, alreadyIssued: true, invoice_number: order.invoice_number });

  const settings = getSettings(db);
  try {
    const inv = await createInvoiceForOrder(order, settings);
    saveInvoice(order.id, inv, db);
    return NextResponse.json({ ok: true, ...inv });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al facturar";
    return NextResponse.json({ error: msg.slice(0, 300) }, { status: 502 });
  }
}
