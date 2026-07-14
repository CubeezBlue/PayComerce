import { NextRequest, NextResponse } from "next/server";
import { listRooms, getTablesWithCarts, tableSalesStats } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

// Estado completo del salón: salas + mesas (con su cuenta abierta) + estadísticas.
export async function GET(req: NextRequest) {
  const err = await guardAddonPerm(req, "mesas", "mesas");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const roomId = req.nextUrl.searchParams.get("room");
  return NextResponse.json({
    rooms: listRooms(db),
    tables: getTablesWithCarts(roomId ? Number(roomId) : null, db),
    stats: tableSalesStats(db),
  });
}
