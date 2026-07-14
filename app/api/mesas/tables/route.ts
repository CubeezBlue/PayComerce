import { NextRequest, NextResponse } from "next/server";
import { createTable } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

// Crear mesa (configuración del salón → requiere permiso config).
export async function POST(req: NextRequest) {
  const err = await guardAddonPerm(req, "mesas", "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const b = await req.json();
  const id = createTable(
    {
      room_id: b.room_id != null ? Number(b.room_id) : null,
      name: String(b.name ?? "").trim() || "Mesa",
      seats: b.seats != null ? Number(b.seats) : 4,
      pos_x: b.pos_x != null ? Number(b.pos_x) : 20,
      pos_y: b.pos_y != null ? Number(b.pos_y) : 20,
    },
    storeDbFromReq(req),
  );
  return NextResponse.json({ id }, { status: 201 });
}
