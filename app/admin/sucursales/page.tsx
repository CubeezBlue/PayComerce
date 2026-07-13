import BranchesManager from "@/components/admin/BranchesManager";
import { requireFeature, requirePermission } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  await requirePermission("sucursales");
  await requireFeature("branches");
  return <BranchesManager />;
}
