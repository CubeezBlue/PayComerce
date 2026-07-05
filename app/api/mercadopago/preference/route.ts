import { NextRequest, NextResponse } from "next/server";
import { getSettings, createOrder, deleteOrder } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";

// Crea la preferencia de pago en Mercado Pago (Checkout Pro) y guarda el pedido.
// Devuelve el init_point al que redirige el cliente para pagar.
export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const slug = slugFromReq(req);
  const settings = getSettings(db);
  const token = settings.mp_access_token?.trim();
  if (!token) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  const b = await req.json();
  const items = Array.isArray(b.items) ? b.items : [];
  if (!b.customer_name || items.length === 0)
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });

  const shipping = Number(b.shipping ?? 0);
  const total = Number(b.total ?? 0);

  // 1) Guardar el pedido (queda como "nuevo", pago online)
  const orderId = createOrder({
    code: String(b.code ?? ""),
    branch_id: b.branch_id ?? null,
    customer_name: String(b.customer_name ?? ""),
    phone: String(b.phone ?? ""),
    address: String(b.address ?? ""),
    delivery: b.delivery === "delivery" ? "delivery" : "pickup",
    payment: "online",
    notes: String(b.notes ?? ""),
    items: items.map((i: { product_id?: unknown; name?: unknown; qty?: unknown; price?: unknown }) => ({
      product_id: i.product_id != null ? Number(i.product_id) : undefined,
      name: String(i.name ?? ""),
      qty: Number(i.qty ?? 0),
      price: Number(i.price ?? 0),
    })),
    subtotal: Number(b.subtotal ?? 0),
    shipping,
    total,
    invoice: !!b.invoice,
    cuit: String(b.cuit ?? ""),
    payment_status: "pending", // hasta que el webhook confirme el pago
    created_at: new Date().toISOString(),
  }, db);

  // 2) Armar la preferencia
  const origin = req.nextUrl.origin;
  const mpItems = items.map((i: { name?: unknown; qty?: unknown; price?: unknown }) => ({
    title: String(i.name ?? "Producto"),
    quantity: Number(i.qty ?? 1),
    unit_price: Number(i.price ?? 0),
    currency_id: "ARS",
  }));
  if (shipping > 0) mpItems.push({ title: "Envío", quantity: 1, unit_price: shipping, currency_id: "ARS" });

  // MP solo acepta auto_return con URLs públicas HTTPS (no localhost)
  const isPublic = /^https:\/\//.test(origin) && !/localhost|127\.0\.0\.1/.test(origin);
  const back = `${origin}/pago/retorno?order=${orderId}`;
  const preference: Record<string, unknown> = {
    items: mpItems,
    // Codificamos el comercio para que el webhook sepa a qué base pertenece
    external_reference: `${slug}:${orderId}`,
    payer: { name: String(b.customer_name ?? "") },
    back_urls: { success: back, failure: back, pending: back },
    statement_descriptor: (settings.store_name || "PayComerce").slice(0, 22),
  };
  if (isPublic) {
    preference.auto_return = "approved";
    // MP solo acepta notification_url pública; el ?store deja el webhook apuntando al comercio
    preference.notification_url = `${origin}/api/mercadopago/webhook?store=${slug}`;
  }

  // 3) Llamar a Mercado Pago
  try {
    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(preference),
    });
    const data = await mpRes.json();
    if (!mpRes.ok) {
      deleteOrder(orderId); // no dejamos pedido huérfano si MP falla
      return NextResponse.json({ error: data.message || "Error de Mercado Pago", detail: data }, { status: 502 });
    }
    return NextResponse.json({ order_id: orderId, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch {
    deleteOrder(orderId);
    return NextResponse.json({ error: "No se pudo conectar con Mercado Pago" }, { status: 502 });
  }
}
