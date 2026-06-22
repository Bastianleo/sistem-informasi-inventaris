import useSWR, { useSWRConfig } from "swr";

import { fetcher } from "@/lib/fetcher";
import { Category, Product, StockMovement, Supplier } from "@/lib/types";

export const CATEGORIES_KEY = "/api/categories";
export const SUPPLIERS_KEY = "/api/suppliers";
export const PRODUCTS_KEY = "/api/products";
export const MOVEMENTS_KEY = "/api/stock-movements";

export function useRevalidate() {
  const { mutate } = useSWRConfig();
  return (keys: string[]) => Promise.all(keys.map((key) => mutate(key)));
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    CATEGORIES_KEY,
    fetcher
  );
  return { categories: data ?? [], error, isLoading, mutate };
}

export function useSuppliers() {
  const { data, error, isLoading, mutate } = useSWR<Supplier[]>(
    SUPPLIERS_KEY,
    fetcher
  );
  return { suppliers: data ?? [], error, isLoading, mutate };
}

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    PRODUCTS_KEY,
    fetcher
  );
  return { products: data ?? [], error, isLoading, mutate };
}

export function useMovements() {
  const { data, error, isLoading, mutate } = useSWR<StockMovement[]>(
    MOVEMENTS_KEY,
    fetcher
  );
  return { movements: data ?? [], error, isLoading, mutate };
}
