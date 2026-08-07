// Suscripción del SaaS: PayComerce le cobra la mensualidad al comercio mediante
// MP Suscripciones (preapproval), usando la cuenta de MP de PayComerce.
// Requiere el Access Token de producción de PayComerce en MP_ACCESS_TOKEN.

import { TRIAL_DAYS } from "./db";
import { log } from "./log";

export function platformMpToken(): string | undefined {
  return process.env.MP_ACCESS_TOKEN?.trim();
}

export function subscriptionConfigured(): boolean {
  return !!platformMpToken();
}

type PreapprovalInput = { slug: string; planName: string; amount: number; payerEmail: string; backUrl: string; withTrial: boolean; billing?: "monthly" | "annual"; startDate?: string };

// Crea la suscripción (preapproval) y devuelve el init_point donde el comercio
// carga la tarjeta. billing "annual" cobra cada 12 meses (monto ya con 20% off).
// startDate difiere el primer cobro (para respetar la prueba gratis).
export async function createPreapproval(i: PreapprovalInput): Promise<{ id: string; init_point: string } | { error: string }> {
  const token = platformMpToken();
  if (!token) return { error: "Falta MP_ACCESS_TOKEN en el servidor" };
  const annual = i.billing === "annual";
  const auto_recurring: Record<string, unknown> = {
    frequency: annual ? 12 : 1,
    frequency_type: "months",
    transaction_amount: i.amount,
    currency_id: "ARS",
  };
  // Primer cobro al terminar la prueba (deja la tarjeta ahora, se le cobra el día 14).
  // OJO: en el sandbox de MP este campo puede tirar 500; en producción funciona.
  if (i.startDate) auto_recurring.start_date = i.startDate;
  try {
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `Suscripción PayComerce — ${i.planName} (${annual ? "anual" : "mensual"})`,
        external_reference: i.slug,
        payer_email: i.payerEmail,
        back_url: i.backUrl,
        auto_recurring,
        status: "pending",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.init_point) {
      // Motivo real que devuelve MP (para diagnosticar): message, cause[0].description, error…
      const reason =
        (Array.isArray(data?.cause) && data.cause[0]?.description) || data?.message || data?.error || `HTTP ${res.status}`;
      log.error("mp-subscription: no se pudo crear el preapproval", null, {
        status: res.status, reason, payerEmail: i.payerEmail, amount: i.amount, billing: i.billing || "monthly",
        mp: JSON.stringify(data).slice(0, 700),
      });
      return { error: String(reason).slice(0, 220) };
    }
    return { id: String(data.id), init_point: String(data.init_point) };
  } catch (e) {
    log.error("mp-subscription: excepción creando el preapproval", e);
    return { error: "No se pudo conectar con Mercado Pago" };
  }
}

// Actualiza el monto de una suscripción existente (cuando el comercio suma o saca
// un adicional, o cambia de plan). MP re-cobra el nuevo monto en el próximo ciclo.
export async function updatePreapprovalAmount(id: string, amount: number): Promise<{ ok: true } | { error: string }> {
  const token = platformMpToken();
  if (!token) return { error: "Falta MP_ACCESS_TOKEN" };
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ auto_recurring: { transaction_amount: amount, currency_id: "ARS" } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = (Array.isArray(data?.cause) && data.cause[0]?.description) || data?.message || `HTTP ${res.status}`;
      log.error("mp-subscription: no se pudo actualizar el monto", null, { status: res.status, reason, amount });
      return { error: String(reason).slice(0, 200) };
    }
    return { ok: true };
  } catch (e) {
    log.error("mp-subscription: excepción actualizando el monto", e);
    return { error: "No se pudo conectar con Mercado Pago" };
  }
}

// Consulta el estado de una suscripción en MP.
export async function getPreapproval(id: string): Promise<{ status: string; external_reference?: string } | null> {
  const token = platformMpToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { status: String(d.status), external_reference: d.external_reference };
  } catch {
    return null;
  }
}
