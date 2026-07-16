import { NextRequest, NextResponse } from "next/server";
import { listStores, getStoreDb, getSettings, setStoreSettings, subscriptionState } from "@/lib/db";
import { emailConfigured, sendEmail, trialEndingEmailHtml, trialExpiredEmailHtml } from "@/lib/email";

// Tarea programada (la dispara un workflow diario). Avisa por email a los
// comercios cuya prueba está por vencer o ya venció. Protegida por CRON_SECRET.
// Se marca un flag por comercio para no reenviar el mismo aviso todos los días.
const DAYS_BEFORE = 3;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const given = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret") || "";
  if (!secret || given !== secret) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  if (!emailConfigured()) return NextResponse.json({ skipped: "email no configurado" });

  const now = Date.now();
  let ending = 0, expired = 0;

  for (const s of listStores()) {
    if (s.slug === "demo") continue;
    try {
      const db = getStoreDb(s.slug);
      const settings = getSettings(db);
      const email = settings.admin_email?.trim();
      if (!email) continue;
      const storeName = settings.store_name || s.name;
      const planLink = `${req.nextUrl.origin}/t/${s.slug}/admin/plan`;
      const state = subscriptionState(settings, now);

      if (state === "trial" && settings.trial_ends_at) {
        const daysLeft = Math.ceil((Date.parse(settings.trial_ends_at) - now) / 86400000);
        if (daysLeft >= 0 && daysLeft <= DAYS_BEFORE && settings.trial_reminder_sent !== "1") {
          if (await sendEmail(email, `Tu prueba de PayComerce vence en ${daysLeft} día${daysLeft === 1 ? "" : "s"}`, trialEndingEmailHtml(storeName, daysLeft, planLink))) {
            setStoreSettings(s.slug, { trial_reminder_sent: "1" });
            ending++;
          }
        }
      } else if (state === "expired" && settings.trial_expired_notified !== "1") {
        if (await sendEmail(email, "Tu prueba de PayComerce venció — reactivá tu tienda", trialExpiredEmailHtml(storeName, planLink))) {
          setStoreSettings(s.slug, { trial_expired_notified: "1" });
          expired++;
        }
      }
    } catch { /* una tienda que falla no corta el resto */ }
  }

  return NextResponse.json({ ok: true, ending, expired });
}
