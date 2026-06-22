interface ApiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

async function request<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      return {
        success: false,
        message: json?.message ?? "Terjadi kesalahan. Coba lagi.",
      };
    }

    return { success: true, data: json.data as T };
  } catch {
    return {
      success: false,
      message: "Tidak dapat terhubung ke server. Periksa koneksi Anda.",
    };
  }
}

// ----- Auth -----
export function loginRequest(input: {
  email: string;
  password: string;
  remember: boolean;
}) {
  return request("/api/auth/login", "POST", input);
}

export function logoutRequest() {
  return request("/api/auth/logout", "POST");
}

// ----- Categories -----
export function createCategory(input: { name: string; description: string }) {
  return request("/api/categories", "POST", input);
}
export function updateCategory(
  id: string,
  input: { name: string; description: string }
) {
  return request(`/api/categories/${id}`, "PATCH", input);
}
export function deleteCategory(id: string) {
  return request(`/api/categories/${id}`, "DELETE");
}

// ----- Suppliers -----
export function createSupplier(input: {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}) {
  return request("/api/suppliers", "POST", input);
}
export function updateSupplier(
  id: string,
  input: {
    name: string;
    contactName: string;
    phone: string;
    email: string;
    address: string;
  }
) {
  return request(`/api/suppliers/${id}`, "PATCH", input);
}
export function deleteSupplier(id: string) {
  return request(`/api/suppliers/${id}`, "DELETE");
}

// ----- Products -----
export interface ProductInput {
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  minStock: number;
  description?: string;
  stock?: number;
}
export function createProduct(input: ProductInput) {
  return request("/api/products", "POST", input);
}
export function updateProduct(id: string, input: ProductInput) {
  return request(`/api/products/${id}`, "PATCH", input);
}
export function deleteProduct(id: string) {
  return request(`/api/products/${id}`, "DELETE");
}

// ----- Stock Movements -----
export interface MovementInput {
  productId: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  note?: string;
  reference?: string;
}
export function createMovement(input: MovementInput) {
  return request("/api/stock-movements", "POST", input);
}
export function deleteMovement(id: string) {
  return request(`/api/stock-movements/${id}`, "DELETE");
}
