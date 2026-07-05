import PagoRetorno from "@/components/PagoRetorno";

export const dynamic = "force-dynamic";

export default async function PagoRetornoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = String(sp.status ?? sp.collection_status ?? "");
  const order = String(sp.order ?? sp.external_reference ?? "");
  return <PagoRetorno status={status} order={order} />;
}
