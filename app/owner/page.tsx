import { cookies } from "next/headers";
import { listStoresWithInfo } from "@/lib/db";
import { checkOwner, ownerEnabled, OWNER_COOKIE } from "@/lib/auth";
import { PLANS, ADDONS, PlanId } from "@/lib/plans";
import { formatPrice } from "@/lib/format";
import OwnerLogin from "@/components/owner/OwnerLogin";
import OwnerLogout from "@/components/owner/OwnerLogout";
import OwnerStores from "@/components/owner/OwnerStores";

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
  const totalRevenue = stores.reduce((s, st) => s + st.revenue, 0);
  const activeCount = stores.filter((s) => !s.paused).length;

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
          <Metric label="Tiendas" value={`${stores.length}`} sub={`${activeCount} activas`} />
          <Metric label="Ingreso mensual estimado" value={formatPrice(totalMrr)} />
          <Metric label="Ventas de los comercios" value={formatPrice(totalRevenue)} />
          <Metric label="Con Mercado Pago" value={String(stores.filter((s) => s.addons.includes("mp") || PLANS[s.plan as PlanId]?.includedAddons.includes("mp")).length)} />
        </div>

        {/* Tabla de tiendas con acciones */}
        <div className="mt-8">
          <OwnerStores stores={stores} />
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          “Ingreso mensual estimado” = lo que paga cada tienda por su plan + integraciones. “Ventas de los comercios” = total facturado por las tiendas (no es tu ingreso). Eliminar una tienda borra todos sus datos y es irreversible.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}
