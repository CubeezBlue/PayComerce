import { cookies } from "next/headers";
import { listStoresWithInfo } from "@/lib/db";
import { checkOwner, ownerEnabled, OWNER_COOKIE } from "@/lib/auth";
import { PLANS, ADDONS, PlanId } from "@/lib/plans";
import { formatPrice } from "@/lib/format";
import OwnerLogin from "@/components/owner/OwnerLogin";
import OwnerLogout from "@/components/owner/OwnerLogout";

export const dynamic = "force-dynamic";

function planName(id: string) {
  return PLANS[id as PlanId]?.name ?? id;
}

// Ingreso mensual estimado de una tienda: plan + addons activos no incluidos.
function mrrOf(plan: string, addons: string[]) {
  const p = PLANS[plan as PlanId];
  if (!p) return 0;
  const included = p.includedAddons as string[];
  const addonSum = ADDONS
    .filter((a) => addons.includes(a.key) && !included.includes(a.key) && !a.soon)
    .reduce((s, a) => s + a.price, 0);
  return p.price + addonSum;
}

export default async function OwnerPage() {
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  if (!checkOwner(token)) {
    return (
      <div className="min-h-screen bg-white text-neutral-900">
        <OwnerLogin configured={ownerEnabled()} />
      </div>
    );
  }

  const stores = listStoresWithInfo();
  const totalMrr = stores.reduce((s, st) => s + mrrOf(st.plan, st.addons), 0);
  const totalOrders = stores.reduce((s, st) => s + st.orders, 0);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#4f46e5] text-lg font-black text-white">P</span>
            <div>
              <h1 className="text-xl font-bold leading-none">PayComerce — Dueño</h1>
              <p className="text-xs text-neutral-400">Todas las tiendas de la plataforma</p>
            </div>
          </div>
          <OwnerLogout />
        </div>

        {/* Métricas globales */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Tiendas" value={String(stores.length)} />
          <Metric label="Ingreso mensual estimado" value={formatPrice(totalMrr)} />
          <Metric label="Pedidos totales" value={String(totalOrders)} />
          <Metric label="Con Mercado Pago" value={String(stores.filter((s) => s.addons.includes("mp") || PLANS[s.plan as PlanId]?.includedAddons.includes("mp")).length)} />
        </div>

        {/* Tabla de tiendas */}
        <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
                  <th className="px-4 py-3">Tienda</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Integraciones</th>
                  <th className="px-4 py-3 text-right">Productos</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3">Alta</th>
                  <th className="px-4 py-3">Accesos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stores.map((s) => (
                  <tr key={s.slug} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-neutral-400">/t/{s.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#4f46e5]/10 px-2 py-0.5 text-xs font-semibold text-[#4f46e5]">{planName(s.plan)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.addons.length === 0 && <span className="text-xs text-neutral-300">—</span>}
                        {s.addons.map((a) => (
                          <span key={a} className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                            {ADDONS.find((x) => x.key === a)?.icon} {a}
                            {a === "mp" && !s.mpConfigured && <span title="Sin credenciales"> ⚠️</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.products}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.orders}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{s.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a href={`/t/${s.slug}`} className="text-[#4f46e5] hover:underline">Tienda</a>
                        <a href={`/t/${s.slug}/admin`} className="text-neutral-500 hover:underline">Panel</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          El “Ingreso mensual estimado” asume que cada tienda paga su plan + integraciones activas. ⚠️ = integración activada sin credenciales cargadas.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
