export type Locale = "en" | "es";
export type Translatable = Record<Locale, string>;

export interface Category {
  id: string;
  slug: string;
  name: Translatable;
  parent_id?: string | null;
  image_url?: string;
  icon?: string;
  item_count?: number;
  discount_percent?: number | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
}

export interface Product {
  id: string;
  slug: string;
  name: Translatable;
  description: Translatable;
  price: number;
  original_price?: number | null;
  image_url: string;
  category_slug: string;
  discount: boolean;
  discount_text?: Translatable | null;
  new_arrival: boolean;
  stock: number;
  featured: boolean;
  best_seller?: boolean;
  free_shipping?: boolean;
  published?: boolean;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Bundle {
  id: string;
  name: Translatable;
  description: Translatable;
  bundle_price: number;
  image_url?: string | null;
  product_ids: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses?: number | null;
  uses_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  active: boolean;
  created_at?: string;
}

export interface DeliveryZone {
  id: string;
  state_code: string;
  city?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface BulkQuote {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  project_type: string;
  estimated_quantity: string;
  delivery: "deliver" | "pickup";
  timeline: string;
  notes?: string;
  status: "new" | "contacted" | "won" | "lost";
  created_at: string;
}

export interface OrderLineItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_amount: number;
}

export type OrderStatus =
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  stripe_session_id: string;
  customer_email: string;
  total_amount: number;
  line_items: OrderLineItem[];
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: Translatable;
  price: number;
  image_url: string;
  quantity: number;
}
