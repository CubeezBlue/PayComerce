// Horarios de atención por día. getDay(): 0=Domingo ... 6=Sábado.
export type DayHours = { open: boolean; from: string; to: string };
export type WeekHours = Record<string, DayHours>;

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const DEFAULT_WEEK: WeekHours = {
  "0": { open: true, from: "19:00", to: "23:30" },
  "1": { open: true, from: "19:00", to: "23:30" },
  "2": { open: true, from: "19:00", to: "23:30" },
  "3": { open: true, from: "19:00", to: "23:30" },
  "4": { open: true, from: "19:00", to: "23:30" },
  "5": { open: true, from: "19:00", to: "23:30" },
  "6": { open: true, from: "19:00", to: "23:30" },
};

export function parseWeek(raw: string | undefined): WeekHours {
  if (!raw) return DEFAULT_WEEK;
  try {
    const w = JSON.parse(raw);
    if (w && typeof w === "object") return { ...DEFAULT_WEEK, ...w };
  } catch {}
  return DEFAULT_WEEK;
}

function toMin(t: string): number {
  const [h, m] = (t || "0:0").split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

// ¿Está abierto en el momento `date`? Contempla horarios que cruzan medianoche.
export function isOpenAt(week: WeekHours, date: Date): boolean {
  const day = date.getDay();
  const now = date.getHours() * 60 + date.getMinutes();
  const check = (cfg?: DayHours) => {
    if (!cfg?.open) return false;
    const from = toMin(cfg.from);
    const to = toMin(cfg.to);
    if (to <= from) return now >= from; // cruza medianoche: la parte de este día
    return now >= from && now < to;
  };
  if (check(week[String(day)])) return true;
  // horario del día anterior que cruza medianoche (ej: cerró a las 01:00)
  const prev = week[String((day + 6) % 7)];
  if (prev?.open) {
    const from = toMin(prev.from);
    const to = toMin(prev.to);
    if (to <= from && now < to) return true;
  }
  return false;
}

// Próxima apertura, en texto ("hoy a las 19:00" / "el Lunes a las 19:00")
export function nextOpenLabel(week: WeekHours, date: Date): string {
  const nowMin = date.getHours() * 60 + date.getMinutes();
  for (let i = 0; i < 7; i++) {
    const day = (date.getDay() + i) % 7;
    const cfg = week[String(day)];
    if (!cfg?.open) continue;
    const from = toMin(cfg.from);
    if (i === 0 && from <= nowMin) continue; // ya pasó hoy
    const when = i === 0 ? "hoy" : i === 1 ? "mañana" : `el ${DAY_NAMES[day]}`;
    return `${when} a las ${cfg.from}`;
  }
  return "";
}
