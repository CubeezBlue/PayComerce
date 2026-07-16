import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatus } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardPerm } from "@/lib/apiguard";

type Params = { params: Promise<{ id: string }> };

const ALLOWED = ["pending", "approved", "rejected", "offline"];

// Marca el estado de pago a mano (ej: transferencia recibida o no).
export async function POST(req: NextRequest, { params }: Params) {
  const gErr = await guardPerm("pedidos");
  if (gErr) return NextResponse.json({ error: gErr }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  const status = String(b.payment_status ?? "");
  if (!ALLOWED.includes(status))
    return NextResponse.json({ error: "Estado de pago inválido" }, { status: 400 });
  if (!updatePaymentStatus(Number(id), status, undefined, storeDbFromReq(req)))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
