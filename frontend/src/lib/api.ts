import type { PageResult } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sigem_token");
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("sigem_token");
    localStorage.removeItem("sigem_user");
    window.location.href = "/login";
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error ?? "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value) !== "") query.set(key, String(value));
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const listResource = <T>(resource: string, params: Record<string, string | number | undefined>) =>
  apiFetch<PageResult<T>>(`/${resource}${queryString(params)}`);
