import type { Metadata } from "next";
import ResetPassword from "@/components/marketing/ResetPassword";

export const metadata: Metadata = { title: "Restablecer contraseña — PayComerce" };
export const dynamic = "force-dynamic";

export default async function RestablecerPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <ResetPassword token={token} />;
}
