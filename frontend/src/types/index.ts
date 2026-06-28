export type UserRole = "admin" | "staff";

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type ValidationStatus = "validado" | "em_validacao" | "nao_validado";

export interface Product {
  id: string;
  organization_id: string;
  category_id: string;
  category_name?: string;
  shopee_url: string;
  name: string;
  image_url: string | null;
  current_price: number | null;
  validation_status: ValidationStatus;
  created_by: string;
  created_by_name?: string;
  posted_on_shopee_at: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface DailySale {
  id: string;
  product_id: string;
  date: string;
  sales_count: number;
  revenue: number | null;
}

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  recorded_at: string;
  price: number;
}

export interface ProductCategory {
  id: string;
  organization_id: string;
  name: string;
}

export interface AdGeneration {
  id: string;
  organization_id: string;
  product_id: string;
  created_by: string;
  created_by_name?: string;
  title: string;
  body: string;
  image_url: string | null;
  variation_label: string;
  created_at: string;
}
