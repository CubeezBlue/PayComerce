import { NextRequest, NextResponse } from "next/server";
import { updateStaff, setStaffPassword, deleteStaff, getStaffById, getSettings } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { getActor } from "@/lib/actor";
import { hasAddon } from "@/lib/plans";
import { hashPassword, validatePassword } from "@/lib/auth";
import { PERMISSIONS, Permission } from "@/lib/permissions";
import { log } from "@/lib/log";

async function ownerWithEquipos(req: NextRequest) {
  const actor = await getActor();
  if (!actor || actor.kind !== "owner") return false;
  return hasAddon(getSettings(storeDbFromReq(req)), "equipos");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ownerWithEquipos(req))) return NextResponse.json({ error: "Solo el dueño con el adicional de Equipo" }, { status: 403 });
  const db = storeDbFromReq(req);
  const id = Number((await params).id);
  if (!getStaffById(id, db)) return NextResponse.json({ error: "Empleado inexistente" }, { status: 404 });
  const b = await req.json();

  if (b.password != null) {
    const pwErr = validatePassword(String(b.password));
    if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
    setStaffPassword(id, hashPassword(String(b.password)), db);
  }

  const fields: { name?: string; permissions?: Permission[]; active?: boolean } = {};
  if (b.name != null) fields.name = String(b.name).trim();
  if (Array.isArray(b.permissions)) fields.permissions = b.permissions.filter((p: string) => (PERMISSIONS as readonly string[]).includes(p));
  if (b.active != null) fields.active = !!b.active;
  updateStaff(id, fields, db);

  log.info("staff: empleado actualizado", { slug: slugFromReq(req), staffId: id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await ownerWithEquipos(req))) return NextResponse.json({ error: "Solo el dueño con el adicional de Equipo" }, { status: 403 });
  const db = storeDbFromReq(req);
  const id = Number((await params).id);
  deleteStaff(id, db);
  log.info("staff: empleado eliminado", { slug: slugFromReq(req), staffId: id });
  return NextResponse.json({ ok: true });
}
