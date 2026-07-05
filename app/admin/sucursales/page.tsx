import BranchesManager from "@/components/admin/BranchesManager";
import { requireFeature } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function SucursalesPage() {
  await requireFeature("branches");
  return <BranchesManager />;
}
