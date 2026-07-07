export type Category = { id: number; name: string; position: number };

export type Product = {
  id: number;
  category_id: number | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number | null;
  active: number;
  position: number;
};

export type Branch = {
  id: number;
  name: string;
  address: string;
  whatsapp_number: string;
  active: number;
  position: number;
  lat: number | null;
  lon: number | null;
};

export type DeliveryBand = {
  id: number;
  branch_id: number;
  max_km: number;
  cost: number;
  min_order: number;
  position: number;
};

export type BranchStock = { branch_id: number; stock: number | null };

export type DeliveryZone = {
  id: number;
  name: string;
  cost: number;
  min_order: number; // pedido mínimo para esa zona (0 = sin mínimo)
  active: number;
  position: number;
};

export type OptionItem = { id: number; group_id: number; name: string; price: number; position: number };
export type OptionGroup = {
  id: number;
  product_id: number;
  name: string;
  min_select: number;
  max_select: number;
  position: number;
  options: OptionItem[];
};
export type StoreProduct = Product & { branches: BranchStock[]; optionGroups: OptionGroup[] };

export type CartItem = { product: Product; qty: number };
