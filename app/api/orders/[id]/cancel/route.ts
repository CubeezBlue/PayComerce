import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

type Params = { params: Promise<{ id: string }> };

// Cancela el pedido y repone el stock descontado.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!cancelOrder(Number(id), storeDbFromReq(req)))
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
