import type { Order, InvoiceData } from "./db";

type Settings = Record<string, string>;

// AfipSDK es CommonJS; se importa dinámicamente para no romper el bundling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadAfip(): Promise<any> {
  const mod = await import("@afipsdk/afip.js");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).default ?? mod;
}

export function isAfipConfigured(s: Settings): boolean {
  return !!(s.afip_access_token?.trim() && s.afip_cuit?.trim());
}

// Determina tipo de comprobante según condición del comercio y datos del cliente.
function resolveType(condicion: string, customerDoc: string) {
  const digits = (customerDoc || "").replace(/\D/g, "");
  const isCuit = digits.length === 11;
  const isDni = digits.length >= 7 && digits.length <= 8;

  if (condicion === "responsable_inscripto") {
    if (isCuit) return { cbteTipo: 1, letra: "A", docTipo: 80, docNro: Number(digits) };
    if (isDni) return { cbteTipo: 6, letra: "B", docTipo: 96, docNro: Number(digits) };
    return { cbteTipo: 6, letra: "B", docTipo: 99, docNro: 0 };
  }
  // Monotributo / Exento → Factura C
  if (isCuit) return { cbteTipo: 11, letra: "C", docTipo: 80, docNro: Number(digits) };
  if (isDni) return { cbteTipo: 11, letra: "C", docTipo: 96, docNro: Number(digits) };
  return { cbteTipo: 11, letra: "C", docTipo: 99, docNro: 0 };
}

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function ymdToDisplay(ymd: string): string {
  if (!/^\d{8}$/.test(ymd)) return ymd;
  return `${ymd.slice(6, 8)}/${ymd.slice(4, 6)}/${ymd.slice(0, 4)}`;
}

// Factura simulada (cuando ARCA no está configurado) — para demo.
function simulatedInvoice(order: Order, settings: Settings): InvoiceData {
  const condicion = settings.afip_condicion || "monotributo";
  const ptoVta = Number(settings.afip_punto_venta || 1);
  const t = resolveType(condicion, order.cuit);
  const nro = Math.floor(10000 + (order.id % 90000));
  const cae = "7" + pad(order.id, 3) + todayYmd().slice(2) + pad(nro % 1000, 3);
  const vto = new Date();
  vto.setDate(vto.getDate() + 10);
  return {
    cae: cae.slice(0, 14),
    cae_vto: ymdToDisplay(vto.toISOString().slice(0, 10).replace(/-/g, "")),
    invoice_number: `${pad(ptoVta, 4)}-${pad(nro, 8)}`,
    invoice_type: t.letra,
    invoice_demo: true,
  };
}

// Emite la factura real en ARCA vía AfipSDK.
export async function createInvoiceForOrder(order: Order, settings: Settings): Promise<InvoiceData> {
  if (!isAfipConfigured(settings)) return simulatedInvoice(order, settings);

  const condicion = settings.afip_condicion || "monotributo";
  const ptoVta = Number(settings.afip_punto_venta || 1);
  const t = resolveType(condicion, order.cuit);

  const Afip = await loadAfip();
  const afip = new Afip({
    CUIT: Number((settings.afip_cuit || "").replace(/\D/g, "")),
    access_token: settings.afip_access_token,
    production: settings.afip_production === "1",
  });

  const last: number = await afip.ElectronicBilling.getLastVoucher(ptoVta, t.cbteTipo);
  const nro = last + 1;

  const total = Number(order.total) || 0;
  let ImpNeto = total;
  let ImpIVA = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {
    CantReg: 1,
    PtoVta: ptoVta,
    CbteTipo: t.cbteTipo,
    Concepto: 1, // productos
    DocTipo: t.docTipo,
    DocNro: t.docNro,
    CbteDesde: nro,
    CbteHasta: nro,
    CbteFch: parseInt(todayYmd()),
    ImpTotConc: 0,
    ImpOpEx: 0,
    ImpTrib: 0,
    MonId: "PES",
    MonCotiz: 1,
  };

  if (t.letra === "A" || t.letra === "B") {
    // Precios con IVA incluido → discriminar 21%
    ImpNeto = Math.round((total / 1.21) * 100) / 100;
    ImpIVA = Math.round((total - ImpNeto) * 100) / 100;
    data.Iva = [{ Id: 5, BaseImp: ImpNeto, Importe: ImpIVA }];
  }
  data.ImpTotal = total;
  data.ImpNeto = ImpNeto;
  data.ImpIVA = ImpIVA;

  const res = await afip.ElectronicBilling.createVoucher(data);

  return {
    cae: String(res.CAE),
    cae_vto: ymdToDisplay(String(res.CAEFchVto)),
    invoice_number: `${pad(ptoVta, 4)}-${pad(nro, 8)}`,
    invoice_type: t.letra,
    invoice_demo: false,
  };
}
