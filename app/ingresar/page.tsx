import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/db";
import { getRequestStoreDb, getRequestSlug, getRequestBase } from "@/lib/tenant";
import { checkSession, SESSION_COOKIE } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function IngresarPage() {
  const slug = await getRequestSlug();
  const base = await getRequestBase();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (checkSession(slug, token)) redirect(`${base}/admin`); // ya logueado

  const settings = getSettings(await getRequestStoreDb());
  const firstTime = !settings.admin_password_hash;

  return (
    <div style={{ ["--pc" as string]: "#4f46e5" }} className="min-h-screen bg-white text-neutral-900">
      <LoginForm storeName={settings.store_name || "Tu tienda"} firstTime={firstTime} base={base} />
    </div>
  );
}
