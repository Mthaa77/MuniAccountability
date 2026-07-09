"use client";

export type ApiEnvelope<T> = {
  data: T;
  meta?: {
    generatedAt?: string;
    filters?: Record<string, string | number | null>;
    pagination?: unknown;
    sources?: string[];
    warnings?: string[];
  };
};

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const normalizedPath = path.startsWith("/api/")
    ? path
    : path.startsWith("/v1/")
      ? `/api${path}`
      : `/api/v1/${path.replace(/^\/+/, "")}`;

  const response = await fetch(normalizedPath, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal
  });

  if (!response.ok) {
    throw new ApiClientError(`Request failed for ${normalizedPath}`, response.status);
  }

  return (await response.json()) as ApiEnvelope<T>;
}

export function apiGet<T>(path: string, signal?: AbortSignal) {
  return apiRequest<T>(path, { signal });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiPatch<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: "PATCH", body });
}
