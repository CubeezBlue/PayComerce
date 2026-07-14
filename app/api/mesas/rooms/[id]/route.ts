import { NextRequest, NextResponse } from "next/server";
import { updateRoom, deleteRoom } from "@/lib/db";
import { storeDbFromReq } from "@/lib/tenant";
import { guardAddonPerm } from "@/lib/apiguard";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await guardAddonPerm(req, "mesas", "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const b = await req.json();
  updateRoom(Number((await params).id), String(b.name ?? "").trim(), storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const err = await guardAddonPerm(req, "mesas", "config");
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  deleteRoom(Number((await params).id), storeDbFromReq(req));
  return NextResponse.json({ ok: true });
}
