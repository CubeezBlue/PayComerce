import { NextRequest, NextResponse } from "next/server";
import { slugFromReq, storeDbFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";
import { getSettings, subscriptionState } from "@/lib/db";
import { monthlyTotal, annualTotal } from "@/lib/plans";
import { updatePreapprovalAmount, subscriptionConfigured } from "@/lib/mp-subscription";

// Sincroniza el monto de la suscripción activa con el plan + adicionales actuales.
// Se llama después de guardar cambios en "Mi plan". Si no hay suscripción activa,
// no hace nada (el nuevo monto se usará cuando se suscriba).
export async function POST(req: NextRequest) {
  const slug = slugFromReq(req);
  if (!checkSession(slug, req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const settings = getSettings(storeDbFromReq(req));
  const subId = settings.mp_subscription_id;
  if (!subscriptionConfigured() || !subId || subscriptionState(settings) !== "active") {
    return NextResponse.json({ ok: true, skipped: true });
  }
  const billing = settings.billing_period === "annual" ? "annual" : "monthly";
  const amount = billing === "annual" ? annualTotal(settings) : monthlyTotal(settings);
  const r = await updatePreapprovalAmount(subId, amount);
  if ("error" in r) return NextResponse.json({ error: `Mercado Pago: ${r.error}` }, { status: 502 });
  return NextResponse.json({ ok: true, amount });
}
