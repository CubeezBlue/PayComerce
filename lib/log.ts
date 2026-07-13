// Logger central con niveles (debug < info < warn < error).
// - En producción emite una línea JSON por evento (fácil de capturar en Hostinger
//   o enviar a un servicio de logs más adelante).
// - En desarrollo usa un formato legible con emojis.
// El nivel mínimo se controla con la variable de entorno LOG_LEVEL (default: info).

type Level = "debug" | "info" | "warn" | "error";
const RANK: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN = RANK[(process.env.LOG_LEVEL as Level)] ?? RANK.info;
const isDev = process.env.NODE_ENV !== "production";
const ICON: Record<Level, string> = { debug: "🐛", info: "ℹ️", warn: "⚠️", error: "⛔" };

type Meta = Record<string, unknown>;

function emit(level: Level, msg: string, meta?: Meta) {
  if (RANK[level] < MIN) return;
  // console.error/warn van a stderr; el resto a stdout.
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (isDev) {
    sink(`${ICON[level]} ${msg}`, meta && Object.keys(meta).length ? meta : "");
  } else {
    sink(JSON.stringify({ time: new Date().toISOString(), level, msg, ...(meta || {}) }));
  }
}

export const log = {
  debug: (msg: string, meta?: Meta) => emit("debug", msg, meta),
  info: (msg: string, meta?: Meta) => emit("info", msg, meta),
  warn: (msg: string, meta?: Meta) => emit("warn", msg, meta),
  // error acepta el Error/valor capturado como 2º argumento y lo desglosa.
  error: (msg: string, err?: unknown, meta?: Meta) => {
    const e =
      err instanceof Error ? { error: err.message, stack: err.stack } : err != null ? { error: String(err) } : {};
    emit("error", msg, { ...e, ...(meta || {}) });
  },
};
