// Protección anti fuerza bruta para los logins. En memoria (la app corre en un
// solo proceso en Hostinger). Bloquea tras varios intentos fallidos seguidos.

type Entry = { fails: number; blockedUntil: number; lastFail: number };
const attempts = new Map<string, Entry>();

const MAX_FAILS = 6; // intentos fallidos antes de bloquear
const LOCK_MS = 15 * 60 * 1000; // 15 minutos de bloqueo
const WINDOW_MS = 15 * 60 * 1000; // si no hay fallos en este lapso, se reinicia el contador

// ¿Está bloqueada esta clave? Devuelve segundos restantes (0 = libre).
export function loginBlockedFor(key: string): number {
  const e = attempts.get(key);
  if (!e) return 0;
  const now = Date.now();
  if (e.blockedUntil > now) return Math.ceil((e.blockedUntil - now) / 1000);
  return 0;
}

// Registrar un intento fallido. Bloquea al llegar al máximo.
export function loginFail(key: string): void {
  const now = Date.now();
  const e = attempts.get(key);
  // Contador nuevo si no existe o si pasó la ventana sin fallos.
  if (!e || now - e.lastFail > WINDOW_MS) {
    attempts.set(key, { fails: 1, blockedUntil: 0, lastFail: now });
    return;
  }
  e.fails += 1;
  e.lastFail = now;
  if (e.fails >= MAX_FAILS) e.blockedUntil = now + LOCK_MS;
}

// Login exitoso: limpiar el contador.
export function loginReset(key: string): void {
  attempts.delete(key);
}

// IP del request (para combinar con el identificador del comercio).
export function reqIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
