/**
 * Thin transport seam.
 *
 * Every service in this folder calls `resolve()` instead of returning mock data
 * directly. When a backend exists, swap the body of `resolve()` for a `fetch()`
 * against `API_BASE_URL` — no page or component needs to change.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const MOCK_LATENCY_MS = 220;

export async function resolve<T>(data: T, latency = MOCK_LATENCY_MS): Promise<T> {
  if (latency > 0 && typeof window !== "undefined") {
    await new Promise((r) => setTimeout(r, latency));
  }
  return structuredClone(data);
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "bad_request",
  ) {
    super(message);
    this.name = "ApiError";
  }
}
