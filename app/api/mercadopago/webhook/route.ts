import { NextRequest, NextResponse } from "next/server";
import { getSettings, updatePaymentStatus, getOrderById, saveInvoice } from "@/lib/db";
import { createInvoiceForOrder } from "@/lib/afip";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { log } from "@/lib/log";

// Webhook (IPN) de Mercado Pago. MP avisa cuando cambia el estado de un pago.
// Consultamos el pago real y actualizamos el estado del pedido correspondiente.
// El comercio viene por ?store=slug (lo pusimos en la notification_url).
async function handle(req: NextRequest) {
  const db = storeDbFromReq(req);
  const settings = getSettings(db);
  const token = settings.mp_access_token?.trim();
  if (!token) return NextResponse.json({ ok: true }); // nada que hacer

  // MP puede mandar el id por query (?type=payment&data.id=) o en el body
  const url = req.nextUrl;
  let type = url.searchParams.get("type") || url.searchParams.get("topic") || "";
  let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  try {
    const body = await req.json();
    if (body) {
      type = body.type || body.topic || type;
      paymentId = body.data?.id || body.id || paymentId;
    }
  } catch {
    /* sin body JSON, usamos query */
  }

  if (type !== "payment" || !paymentId) return NextResponse.json({ ok: true });

  try {
    // Consultar el pago real a Mercado Pago (fuente de verdad)
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({ ok: true });
    const payment = await res.json();

    // external_reference = "slug:orderId"
    const ref = String(payment.external_reference || "");
    const orderId = Number(ref.includes(":") ? ref.split(":")[1] : ref);
    const status = String(payment.status || ""); // approved | pending | in_process | rejected | cancelled | refunded
    if (orderId && status) {
      const mapped =
        status === "approved" ? "approved" : status === "rejected" || status === "cancelled" ? "rejected" : "pending";
      updatePaymentStatus(orderId, mapped, String(paymentId), db);
      log.info("mp-webhook: estado de pago actualizado", { slug: slugFromReq(req), orderId, status, mapped, paymentId: String(paymentId) });

      // Si el pago se aprobó y el cliente pidió factura, la emitimos ahora
      if (mapped === "approved") {
        const order = getOrderById(orderId, db);
        if (order && order.invoice && !order.cae) {
          try {
            saveInvoice(orderId, await createInvoiceForOrder(order, settings), db);
          } catch (e) {
            log.warn("mp-webhook: factura quedó pendiente tras aprobar el pago", { slug: slugFromReq(req), orderId, error: e instanceof Error ? e.message : String(e) });
          }
        }
      }
    }
  } catch (e) {
    // Respondemos 200 igual para que MP no reintente en loop, pero dejamos el error registrado.
    log.error("mp-webhook: error consultando el pago en Mercado Pago", e, { slug: slugFromReq(req), paymentId });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

// MP a veces valida el endpoint con un GET
export async function GET() {
  return NextResponse.json({ ok: true });
}
