import Link from "next/link";
import { getProductsWithBranches, getSettings, getBranches, getSalesStats } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getRequestStoreDb, getRequestBase } from "@/lib/tenant";
import { DEFAULT_PALETTE, PALETTE_ROLES } from "@/lib/palettes";
import OnboardingChecklist, { OnboardStep } from "@/components/admin/OnboardingChecklist";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = await getRequestStoreDb();
  const base = await getRequestBase();
  const products = getProductsWithBranches(false, db);
  const branches = getBranches(false, db);
  const settings = getSettings(db);
  const currency = settings.currency || "$";

  // Progreso de configuración inicial (mini tutorial)
  const paletteChanged = PALETTE_ROLES.some((r) => (settings[r.key] || "").toLowerCase() !== (DEFAULT_PALETTE[r.key] || "").toLowerCase());
  const onboardSteps: OnboardStep[] = [
    { key: "logo", icon: "🎨", label: "Subí tu logo", hint: "Tu marca en el encabezado de la tienda.", done: !!settings.logo_url, href: `${base}/admin/configuracion` },
    { key: "colors", icon: "🌈", label: "Elegí tus colores", hint: "La paleta de tu identidad.", done: paletteChanged, href: `${base}/admin/configuracion` },
    { key: "hours", icon: "🕒", label: "Cargá tus horarios", hint: "Abierto/cerrado automático.", done: (settings.hours_json || "").includes('"open":true'), href: `${base}/admin/configuracion` },
    { key: "whatsapp", icon: "💬", label: "Poné tu WhatsApp", hint: "Para recibir los pedidos.", done: !!settings.whatsapp_number, href: `${base}/admin/configuracion` },
    { key: "products", icon: "📦", label: "Cargá tu primer producto", hint: "Lo que vas a vender.", done: products.length > 0, href: `${base}/admin/productos` },
  ];
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const sales = getSalesStats(db);
  const maxDay = Math.max(1, ...sales.last7.map((d) => d.total));

  // Stock bajo: alguna sucursal con 5 o menos unidades
  const lowStock = products
    .flatMap((p) =>
      p.branches
        .filter((b) => b.stock !== null && b.stock <= 5)
        .map((b) => ({ name: p.name, branch: branchName.get(b.branch_id) ?? "", stock: b.stock as number }))
    );

  const stats = [
    { label: "Ventas de hoy", value: formatPrice(sales.todaySales, currency), sub: `${sales.todayCount} pedido(s)` },
    { label: "Ticket promedio", value: formatPrice(sales.todayAvg, currency), sub: "hoy" },
    { label: "Ventas del mes", value: formatPrice(sales.monthSales, currency), sub: "" },
    { label: "Pedidos totales", value: sales.totalOrders, sub: "sin cancelados" },
  ];

  const shortcuts = [
    { href: "/admin/pedidos", icon: "🧾", t: "Tablero de pedidos", d: "Seguí los pedidos en vivo, de nuevo a entregado." },
    { href: "/admin/productos", icon: "📦", t: "Productos y categorías", d: "Crear, editar y organizar por sucursal." },
    { href: "/admin/precios", icon: "📈", t: "Aumentar precios", d: "Suba por % global o por categoría." },
    { href: "/admin/catalogo", icon: "📄", t: "Importar/Exportar Excel", d: "Carga masiva sin límites de plan." },
    { href: "/admin/configuracion", icon: "⚙️", t: "Configurar tienda", d: "Marca, contacto, WhatsApp y más." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hola 👋</h1>
        <p className="text-neutral-500">Resumen de {settings.store_name || "tu tienda"}.</p>
      </div>

      <OnboardingChecklist steps={onboardSteps} storeName={settings.store_name || "tu tienda"} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-xs text-neutral-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Ventas últimos 7 días + más vendidos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-semibold">Ventas últimos 7 días</p>
          <div className="mt-4 flex h-40 items-end justify-between gap-2">
            {sales.last7.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-[var(--brand)]/80"
                    style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: d.total > 0 ? "4px" : "0" }}
                    title={formatPrice(d.total, currency)}
                  />
                </div>
                <span className="text-[10px] text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-semibold">Más vendidos</p>
          {sales.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-400">Todavía no hay ventas.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sales.topProducts.map((p, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--brand)]/10 text-xs font-bold text-[var(--brand)]">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-neutral-500">{p.qty}u · {formatPrice(p.revenue, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="group flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--brand)]/10 text-xl">{s.icon}</span>
            <div>
              <p className="font-semibold group-hover:text-[var(--brand)]">{s.t}</p>
              <p className="text-sm text-neutral-500">{s.d}</p>
            </div>
          </Link>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
          <p className="font-semibold text-amber-800">⚠️ Productos con stock bajo</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {lowStock.map((p, i) => (
              <li key={i}>{p.name}{p.branch ? ` (${p.branch})` : ""} — {p.stock} unidades</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
