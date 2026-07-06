import type { Metadata } from "next";
import GlobalLogin from "@/components/marketing/GlobalLogin";

export const metadata: Metadata = { title: "Ingresar — PayComerce" };
export const dynamic = "force-dynamic";

export default function EntrarPage() {
  return <GlobalLogin />;
}
