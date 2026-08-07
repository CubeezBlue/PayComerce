import { NextRequest, NextResponse } from "next/server";
import { slugFromReq, storeDbFromReq } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";
import { getSettings, setStoreSettings } from "@/lib/db";
import { PLANS, PlanId, monthlyTotal, annualTotal } from "@/lib/plans";
import { createPreapproval, subscriptionConfigured } from "@/lib/mp-subscription";

// Inicia la suscripción del comercio (plan + adicionales). Devuelve el init_point de MP.
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

  const body = await req.json().catch(() => ({}));
  const billing: "monthly" | "annual" = body.billing === "annual" ? "annual" : "monthly";
  // Monto de prueba temporal: si SUBSCRIPTION_TEST_AMOUNT está seteada (>0), se cobra
  // ese monto (para validar en producción con un cargo chico). Quitar la variable
  // restaura el precio real (plan + adicionales).
  const testAmount = Number(process.env.SUBSCRIPTION_TEST_AMOUNT) || 0;
  const amount = testAmount > 0 ? testAmount : (billing === "annual" ? annualTotal(settings) : monthlyTotal(settings));

  const origin = req.nextUrl.origin;
  // Con prueba solo si todavía está en trial (no reactivaciones).
  const withTrial = (settings.subscription_status || "trial") === "trial";
  // Primer cobro al terminar la prueba (deja la tarjeta ahora, se cobra el día 14).
  const trialEnd = settings.trial_ends_at ? Date.parse(settings.trial_ends_at) : NaN;
  const startDate = withTrial && Number.isFinite(trialEnd) && trialEnd > Date.now() ? new Date(trialEnd).toISOString() : undefined;
  const pre = await createPreapproval({
    slug, planName: plan.name, amount, payerEmail: email,
    backUrl: `${origin}/suscripcion?tienda=${slug}`, withTrial, billing, startDate,
  });
  if ("error" in pre) return NextResponse.json({ error: `Mercado Pago: ${pre.error}` }, { status: 502 });

  setStoreSettings(slug, { mp_subscription_id: pre.id, billing_period: billing });
  return NextResponse.json({ init_point: pre.init_point });
}
