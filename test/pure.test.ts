import { describe, it, expect } from "vitest";
import { distanceKm, pointInPolygon, bandForDistance, parseDeliveryPolygon } from "../lib/geo";
import { hasFeature, hasAddon, productLimit, monthlyTotal, annualTotal, planOf } from "../lib/plans";
import { validatePassword, isValidEmail } from "../lib/validation";

describe("geo", () => {
  it("distanceKm ~0 para el mismo punto y >0 para distintos", () => {
    expect(distanceKm(-31.42, -64.18, -31.42, -64.18)).toBeCloseTo(0, 5);
    const d = distanceKm(-31.42, -64.18, -31.43, -64.19);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(3);
  });

  it("pointInPolygon detecta dentro y fuera", () => {
    const sq: [number, number][] = [[-31.40, -64.20], [-31.40, -64.15], [-31.43, -64.15], [-31.43, -64.20]];
    expect(pointInPolygon(-31.415, -64.175, sq)).toBe(true);
    expect(pointInPolygon(-31.50, -64.30, sq)).toBe(false);
  });

  it("bandForDistance elige la franja más chica que contiene", () => {
    const bands = [
      { id: 1, branch_id: 1, max_km: 3, cost: 800, min_order: 0, position: 0 },
      { id: 2, branch_id: 1, max_km: 6, cost: 1200, min_order: 0, position: 1 },
    ];
    expect(bandForDistance(2, bands)?.cost).toBe(800);
    expect(bandForDistance(5, bands)?.cost).toBe(1200);
    expect(bandForDistance(9, bands)).toBeNull();
  });

  it("parseDeliveryPolygon valida el JSON", () => {
    expect(parseDeliveryPolygon(null)).toBeNull();
    expect(parseDeliveryPolygon("no-json")).toBeNull();
    expect(parseDeliveryPolygon(JSON.stringify({ points: [[1, 2]] }))).toBeNull(); // <3 puntos
    const ok = parseDeliveryPolygon(JSON.stringify({ points: [[1, 2], [3, 4], [5, 6]], cost: 500, min_order: 1000 }));
    expect(ok?.cost).toBe(500);
    expect(ok?.points.length).toBe(3);
  });
});

describe("plans", () => {
  const empresa = { plan: "empresa" };
  const emprendedor = { plan: "emprendedor" };

  it("planOf usa el plan de settings (o empresa por defecto)", () => {
    expect(planOf(empresa)).toBe("empresa");
    expect(planOf({})).toBe("empresa");
  });

  it("hasFeature respeta el plan", () => {
    expect(hasFeature(empresa, "branches")).toBe(true);
    expect(hasFeature(emprendedor, "branches")).toBe(false);
    expect(hasFeature(emprendedor, "excel")).toBe(false);
  });

  it("hasAddon: incluido en el plan o activado por flag", () => {
    expect(hasAddon(empresa, "mp")).toBe(true); // incluido en Empresa
    expect(hasAddon(emprendedor, "mp")).toBe(false);
    expect(hasAddon(emprendedor, "caja")).toBe(false);
    expect(hasAddon({ plan: "emprendedor", addon_caja: "1" }, "caja")).toBe(true);
  });

  it("productLimit según plan", () => {
    expect(productLimit(emprendedor)).toBe(50);
    expect(productLimit(empresa)).toBeNull();
  });

  it("monthlyTotal = plan + adicionales activos; annual con 20% off", () => {
    // Empresa ($100.000) + caja ($5.000) activo; mp incluido no suma.
    const s = { plan: "empresa", addon_caja: "1", addon_mp: "1" };
    expect(monthlyTotal(s)).toBe(105000);
    expect(annualTotal(s)).toBe(Math.round(105000 * 12 * 0.8));
  });
});

describe("validation", () => {
  it("isValidEmail", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("validatePassword exige fuerte", () => {
    expect(validatePassword("Clave123!")).toBeNull(); // válida
    expect(validatePassword("corta")).toBeTruthy(); // muy corta
    expect(validatePassword("sinmayus123!")).toBeTruthy(); // sin mayúscula
    expect(validatePassword("SinNumero!")).toBeTruthy(); // sin número
  });
});
