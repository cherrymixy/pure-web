/** Client fetch for app/api routes: JSON in/out, throws ApiError with the route's { error: { code, message } }. */
export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? "HTTP", json?.error?.message ?? `HTTP ${res.status}`);
  return json as T;
}
