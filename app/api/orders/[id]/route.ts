import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus, deleteOrder, ORDER_STATUSES } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const b = await req.json();
  const status = String(b.status ?? "");
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]))
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  if (!updateOrderStatus(Number(id), status, storeDbFromReq(req)))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!deleteOrder(Number(id), storeDbFromReq(req)))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
