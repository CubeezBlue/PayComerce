import { NextRequest, NextResponse } from "next/server";
import { getDeliveryBands, saveDeliveryBands } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getDeliveryBands(storeDbFromReq(req)));
}

// Guarda (reemplaza) las franjas de cobertura de una sucursal.
export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const b = await req.json();
  const branchId = Number(b.branch_id);
  if (!branchId) return NextResponse.json({ error: "Falta la sucursal" }, { status: 400 });
  const bands = Array.isArray(b.bands) ? b.bands : [];
  saveDeliveryBands(branchId, bands, db);
  return NextResponse.json({ ok: true });
}
