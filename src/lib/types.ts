export type Role = "admin" | "staff";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  initialsColor: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  description?: string;
  createdAt: string;
}

export type MovementType = "in" | "out";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  note?: string;
  reference?: string;
  by: string;
}

export type StockStatus = "habis" | "menipis" | "aman";

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return "habis";
  if (product.stock <= product.minStock) return "menipis";
  return "aman";
}
