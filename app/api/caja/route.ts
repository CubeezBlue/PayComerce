import { NextRequest, NextResponse } from "next/server";
import { cashReport, saveCashClosure, listCashClosures, getSettings } from "@/lib/db";
import { storeDbFromReq, slugFromReq } from "@/lib/tenant";
import { getActor, actorCan } from "@/lib/actor";
import { hasAddon } from "@/lib/plans";
import { log } from "@/lib/log";

function parseBranch(v: string | null): number | null {
  return v && v !== "all" ? Number(v) : null;
}
// Día por defecto (hoy en hora argentina, UTC-3).
function todayArg(): string {
  return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

// ¿El actor puede usar la caja? (permiso + adicional contratado)
async function guardCaja(req: NextRequest) {
  if (!hasAddon(getSettings(storeDbFromReq(req)), "caja")) return "El adicional de Caja no está activo";
  if (!actorCan(await getActor(), "caja")) return "No tenés permiso para la caja";
  return null;
}

// Reporte del día + últimos cierres.
export async function GET(req: NextRequest) {
  const err = await guardCaja(req);
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const day = req.nextUrl.searchParams.get("day") || todayArg();
  const branchId = parseBranch(req.nextUrl.searchParams.get("branch"));
  return NextResponse.json({ report: cashReport(day, branchId, db), closures: listCashClosures(branchId, 30, db) });
}

// Guarda un cierre de caja (arqueo).
export async function POST(req: NextRequest) {
  const err = await guardCaja(req);
  if (err) return NextResponse.json({ error: err }, { status: 403 });
  const db = storeDbFromReq(req);
  const b = await req.json();
  const day = String(b.day || todayArg()).slice(0, 10);
  const branchId = b.branch_id != null && b.branch_id !== "all" ? Number(b.branch_id) : null;
  const id = saveCashClosure(
    { branch_id: branchId, day, opening: Number(b.opening) || 0, counted_cash: Number(b.counted_cash) || 0, notes: String(b.notes || "") },
    db,
  );
  log.info("caja: cierre guardado", { slug: slugFromReq(req), day, branchId, closureId: id });
  return NextResponse.json({ id }, { status: 201 });
}
