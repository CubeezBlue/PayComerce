import { NextRequest, NextResponse } from "next/server";
import { getPreapproval } from "@/lib/mp-subscription";
import { setStoreSettings, storeExists, getStoreDb, getSettings } from "@/lib/db";
import { PLANS, planOf } from "@/lib/plans";
import { sendEmail, subscriptionActiveEmailHtml, paymentFailedEmailHtml } from "@/lib/email";

// Webhook de MP para la suscripción del SaaS. MP avisa cambios de la preapproval;
// consultamos el estado real y actualizamos la tienda.
// authorized → active | paused/cancelled → past_due (y se pausará el storefront).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || body.topic || req.nextUrl.searchParams.get("type") || req.nextUrl.searchParams.get("topic");
    const id = body?.data?.id || req.nextUrl.searchParams.get("id") || body?.id;
    if (!id || !/preapproval|subscription/i.test(String(type || ""))) return NextResponse.json({ ok: true });

    const pre = await getPreapproval(String(id));
    const slug = pre?.external_reference;
    if (!pre || !slug || !storeExists(slug)) return NextResponse.json({ ok: true });

    const settings = getSettings(getStoreDb(slug));
    const prev = settings.subscription_status || "trial";
    const email = settings.admin_email?.trim();
    const storeName = settings.store_name || "tu tienda";
    const planLink = `${req.nextUrl.origin}/t/${slug}/admin/plan`;

    const status = pre.status; // pending | authorized | paused | cancelled
    if (status === "authorized" && prev !== "active") {
      setStoreSettings(slug, { subscription_status: "active" });
      if (email) await sendEmail(email, "Tu suscripción a PayComerce está activa", subscriptionActiveEmailHtml(storeName, PLANS[planOf(settings)].name, planLink));
    } else if ((status === "cancelled" || status === "paused") && prev !== "past_due") {
      setStoreSettings(slug, { subscription_status: "past_due" });
      if (email) await sendEmail(email, "No pudimos cobrar tu suscripción — PayComerce", paymentFailedEmailHtml(storeName, planLink));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
