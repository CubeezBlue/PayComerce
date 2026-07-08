import { NextRequest, NextResponse } from "next/server";
import { getPreapproval } from "@/lib/mp-subscription";
import { setStoreSettings, storeExists } from "@/lib/db";

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

    const status = pre.status; // pending | authorized | paused | cancelled
    if (status === "authorized") {
      setStoreSettings(slug, { subscription_status: "active" });
    } else if (status === "cancelled" || status === "paused") {
      setStoreSettings(slug, { subscription_status: "past_due" });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
