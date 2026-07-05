import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/db";
import AdminShell from "@/components/admin/AdminShell";
import { readableOn } from "@/lib/colors";
import { getRequestStoreDb, getRequestSlug } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Requiere sesión iniciada para este comercio
  const slug = await getRequestSlug();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!checkSession(slug, token)) redirect("/ingresar");

  const settings = getSettings(await getRequestStoreDb());
  const brand = settings.color_accent || settings.brand_color || "#EA580C";
  const vars = {
    ["--brand" as string]: brand,
    ["--brand-text" as string]: readableOn(brand),
  };
  return (
    <div style={vars}>
      <AdminShell settings={settings}>{children}</AdminShell>
    </div>
  );
}
