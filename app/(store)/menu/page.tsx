import { getCategories, getProductsWithBranches, getSettings, getBranches } from "@/lib/db";
import Menu from "@/components/Menu";
import { getRequestStoreDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const db = await getRequestStoreDb();
  const settings = getSettings(db);
  const categories = getCategories(db);
  const products = getProductsWithBranches(true, db);
  const branches = getBranches(true, db);
  return <Menu categories={categories} products={products} branches={branches} currency={settings.currency || "$"} />;
}
