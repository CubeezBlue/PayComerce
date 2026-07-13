import EquipoManager from "@/components/admin/EquipoManager";
import { requireOwner } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  await requireOwner();
  return <EquipoManager />;
}
