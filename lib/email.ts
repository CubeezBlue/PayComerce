// Envío de emails vía Resend (https://resend.com). Requiere RESEND_API_KEY y
// EMAIL_FROM configurados como variables de entorno. Si no están, no se envía.

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Layout común de los emails (encabezado + contenedor).
function wrap(inner: string): string {
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c1917">
    <h2 style="color:#4f46e5">PayComerce</h2>
    ${inner}
    <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0" />
    <p style="font-size:12px;color:#78716c">PayComerce — tu tienda online, pagos y facturación.</p>
  </div>`;
}

function button(href: string, text: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600">${text}</a></p>`;
}

// Plantilla del email de recuperación de contraseña.
export function resetEmailHtml(storeName: string, link: string): string {
  return wrap(`
    <p>Recibimos un pedido para restablecer la contraseña de <b>${storeName}</b>.</p>
    <p>Hacé clic en el botón para elegir una nueva contraseña. El enlace vence en 1 hora.</p>
    ${button(link, "Restablecer contraseña")}
    <p style="font-size:12px;color:#78716c">Si no fuiste vos, ignorá este email; tu contraseña no cambia.</p>`);
}

// Bienvenida al crear la tienda.
export function welcomeEmailHtml(storeName: string, adminLink: string): string {
  return wrap(`
    <p>¡Bienvenido/a! Tu tienda <b>${storeName}</b> ya está creada 🎉</p>
    <p>Tenés <b>14 días de prueba gratis</b>. Entrá al panel para cargar tus productos, tu logo y tus colores.</p>
    ${button(adminLink, "Ir a mi panel")}
    <p style="font-size:13px;color:#57534e">Cualquier duda, respondé este email y te ayudamos.</p>`);
}

// Aviso: la prueba gratis está por vencer.
export function trialEndingEmailHtml(storeName: string, daysLeft: number, planLink: string): string {
  return wrap(`
    <p>Tu prueba gratis de <b>${storeName}</b> vence en <b>${daysLeft} día${daysLeft === 1 ? "" : "s"}</b>.</p>
    <p>Activá tu suscripción ahora así tu tienda sigue online sin interrupciones. Podés pagar mensual o anual (20% off) y cancelar cuando quieras.</p>
    ${button(planLink, "Activar mi suscripción")}`);
}

// Aviso: la prueba venció y la tienda quedó pausada.
export function trialExpiredEmailHtml(storeName: string, planLink: string): string {
  return wrap(`
    <p>Terminó la prueba gratis de <b>${storeName}</b> y tu tienda quedó <b>pausada</b>.</p>
    <p>Activá tu suscripción para volver a estar online al instante. Tus datos y productos están guardados.</p>
    ${button(planLink, "Reactivar mi tienda")}`);
}

// Suscripción activada / pago confirmado.
export function subscriptionActiveEmailHtml(storeName: string, planName: string, planLink: string): string {
  return wrap(`
    <p>✅ ¡Listo! La suscripción de <b>${storeName}</b> al plan <b>${planName}</b> quedó activa.</p>
    <p>Gracias por elegir PayComerce. Vas a poder ver el estado de tu plan desde el panel cuando quieras.</p>
    ${button(planLink, "Ver mi plan")}`);
}

// No pudimos cobrar la suscripción.
export function paymentFailedEmailHtml(storeName: string, planLink: string): string {
  return wrap(`
    <p>⚠️ No pudimos cobrar la suscripción de <b>${storeName}</b>, así que tu tienda quedó <b>pausada</b>.</p>
    <p>Revisá tu medio de pago y reactivá la suscripción para volver a estar online.</p>
    ${button(planLink, "Reactivar mi suscripción")}`);
}
