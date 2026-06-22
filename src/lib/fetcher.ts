export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new ApiError(body?.message ?? "Gagal memuat data.", res.status);
  }

  return body.data as T;
}
