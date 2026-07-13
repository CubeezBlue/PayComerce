import { NextRequest, NextResponse } from "next/server";
import { listStaff, createStaff, getStaffByUsername } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { getActor } from "@/lib/actor";
import { hashPassword, validatePassword } from "@/lib/auth";
import { PERMISSIONS, Permission } from "@/lib/permissions";
import { log } from "@/lib/log";

async function ownerOr403() {
  const actor = await getActor();
  return actor && actor.kind === "owner" ? actor : null;
}

export async function GET(req: NextRequest) {
  if (!(await ownerOr403())) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });
  return NextResponse.json(listStaff(storeDbFromReq(req)));
}

export async function POST(req: NextRequest) {
  if (!(await ownerOr403())) return NextResponse.json({ error: "Solo el dueño" }, { status: 403 });
  const db = storeDbFromReq(req);
  const b = await req.json();
  const name = String(b.name ?? "").trim();
  const username = String(b.username ?? "").trim().toLowerCase();
  const password = String(b.password ?? "");
  const permissions = (Array.isArray(b.permissions) ? b.permissions : []).filter((p: string) => (PERMISSIONS as readonly string[]).includes(p)) as Permission[];

  if (!username || !/^[a-z0-9._-]{3,}$/.test(username))
    return NextResponse.json({ error: "El usuario debe tener 3+ caracteres (letras, números, . _ -)" }, { status: 400 });
  const pwErr = validatePassword(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });
  if (getStaffByUsername(username, db)) return NextResponse.json({ error: "Ya existe un empleado con ese usuario" }, { status: 409 });

  const id = createStaff({ name: name || username, username, password_hash: hashPassword(password), permissions }, db);
  log.info("staff: empleado creado", { slug: slugFromReq(req), staffId: id, username });
  return NextResponse.json({ id }, { status: 201 });
}
