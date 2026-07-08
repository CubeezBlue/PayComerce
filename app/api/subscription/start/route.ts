import { NextRequest, NextResponse } from "next/server";
import { slugFromReq, storeDbFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";
import { getSettings, setStoreSettings } from "@/lib/db";
import { PLANS, PlanId } from "@/lib/plans";
import { createPreapproval, subscriptionConfigured } from "@/lib/mp-subscription";

// Inicia la suscripción del comercio al plan que tiene. Devuelve el init_point de MP.
export async function POST(req: NextRequest) {
  const slug = slugFromReq(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!checkSession(slug, token)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!subscriptionConfigured()) return NextResponse.json({ error: "El cobro de suscripción no está configurado." }, { status: 503 });

  const settings = getSettings(storeDbFromReq(req));
  const planId = (settings.plan as PlanId) in PLANS ? (settings.plan as PlanId) : "emprendedor";
  const plan = PLANS[planId];
  const email = settings.admin_email?.trim();
  if (!email) return NextResponse.json({ error: "Falta el email de la cuenta." }, { status: 400 });

  const origin = req.nextUrl.origin;
  // Con prueba solo si todavía está en trial (no reactivaciones).
  const withTrial = (settings.subscription_status || "trial") === "trial";
  const pre = await createPreapproval({
    slug, planName: plan.name, amount: plan.price, payerEmail: email,
    backUrl: `${origin}/t/${slug}/admin/plan?sub=ok`, withTrial,
  });
  if (!pre) return NextResponse.json({ error: "No se pudo crear la suscripción en Mercado Pago." }, { status: 502 });

  setStoreSettings(slug, { mp_subscription_id: pre.id });
  return NextResponse.json({ init_point: pre.init_point });
}
