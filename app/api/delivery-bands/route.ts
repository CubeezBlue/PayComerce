import { NextRequest, NextResponse } from "next/server";
import { getDeliveryBands, saveDeliveryBands, setBranchPolygon } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";

export function GET(req: NextRequest) {
  return NextResponse.json(getDeliveryBands(storeDbFromReq(req)));
}

// Guarda la cobertura de una sucursal. Dos formas mutuamente excluyentes:
//  - "radius":  franjas por radio (círculo) → tabla delivery_bands.
//  - "polygon": zona dibujada a mano → branches.delivery_polygon (JSON con cost/min_order).
// Al guardar una, se limpia la otra para que no queden ambas activas.
export async function POST(req: NextRequest) {
  const db = storeDbFromReq(req);
  const b = await req.json();
  const branchId = Number(b.branch_id);
  if (!branchId) return NextResponse.json({ error: "Falta la sucursal" }, { status: 400 });

  const poly = b.polygon;
  const points = Array.isArray(poly?.points) ? poly.points : [];
  if (b.mode === "polygon" && points.length >= 3) {
    setBranchPolygon(
      branchId,
      JSON.stringify({ points, cost: Number(poly.cost) || 0, min_order: Number(poly.min_order) || 0 }),
      db,
    );
    saveDeliveryBands(branchId, [], db); // limpia el radio
  } else {
    setBranchPolygon(branchId, null, db); // limpia la zona dibujada
    saveDeliveryBands(branchId, Array.isArray(b.bands) ? b.bands : [], db);
  }
  return NextResponse.json({ ok: true });
}
