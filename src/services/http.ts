/**
 * HTTP Client Layer - Nirvona Frontend
 *
 * All frontend services call methods in this file for data access.
 * Automatically routes to backend API when available, falls back to mock data.
 */

// import.meta.env, not process.env.NEXT_PUBLIC_* - Vite exposes only
// VITE_-prefixed env vars to client code, injected at build time the
// same way Next's NEXT_PUBLIC_ prefix worked.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

export const MOCK_LATENCY_MS = 220;

/** Same key useSession()/useLocalStorage use to persist the signed-in session. */
export const SESSION_STORAGE_KEY = "nirvona.session";

/**
 * Read the current JWT out of the persisted session, if any. Every
 * authenticated backend route (AuthMiddleware/AdminMiddleware) checks
 * for this in the Authorization header - nothing here ever attached
 * one before, so every protected request came back 401 regardless of
 * whether the user had "signed in".
 */
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Backend error envelopes come in two shapes depending on which
 * service/era wrote them: `error: { code, message }` (the newer,
 * consistent shape) and plain `error: "some string"` (many older
 * fallback responses across the services). Reading `data.error?.message`
 * alone only ever worked for the first shape - for the second it's
 * `undefined` (strings have no `.message`), so a real, specific
 * backend message like "Unable to fetch answer key" silently fell
 * through to a generic "API returned error" / statusText instead.
 */
function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  const message = (body as { message?: unknown }).message;
  return typeof message === "string" ? message : undefined;
}

function extractErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: unknown }).error;
  if (error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return undefined;
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

/**
 * In-flight GET requests, keyed by URL+token. The PHP dev server
 * (`php -S`) handles one request at a time - when several components
 * ask for the same endpoint in the same render pass (e.g. both the
 * shell badge and a page's own useAsync call adminService.notifications()),
 * those calls used to queue up behind each other on the backend one by
 * one instead of sharing a single response. Deduping identical
 * concurrent GETs collapses them into one real network round trip.
 */
const inFlightGets = new Map<string, Promise<unknown>>();

/**
 * Fetch wrapper with error handling and response transformation
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackData?: T,
): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const token = getStoredToken();
  const dedupeKey = method === "GET" ? `${token ?? ""}:${endpoint}` : null;

  if (dedupeKey) {
    const existing = inFlightGets.get(dedupeKey);
    if (existing) return existing as Promise<T>;
  }

  const request = fetchApiUncached<T>(endpoint, options, fallbackData, token);

  if (dedupeKey) {
    inFlightGets.set(dedupeKey, request);
    // `.finally()` returns its own derived promise that rejects
    // whenever `request` does. Nothing holds a reference to that
    // derived promise (only the cleanup side effect matters here) -
    // without the trailing `.catch()`, every failed request (e.g. a
    // routine 404 for "no admit card yet") became a second, genuinely
    // unhandled promise rejection, on top of the original `request`
    // promise that its actual caller already catches correctly. That
    // surfaced as Next.js's dev-mode error overlay taking over the
    // whole page on any failed request, even one the app handles fine.
    request.finally(() => inFlightGets.delete(dedupeKey)).catch(() => {});
  }

  return request;
}

async function fetchApiUncached<T>(
  endpoint: string,
  options: RequestInit | undefined,
  fallbackData: T | undefined,
  token: string | null,
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Every backend controller returns its {success:false, error:{...}}
      // envelope alongside a non-2xx status (e.g. 400/404) - this used to
      // throw on statusText alone without ever reading that body, so a
      // specific backend message ("Package not found: PKG-JEE-1Y") was
      // always replaced by the generic, useless "API Error: Bad Request"
      // before the caller ever saw it.
      const body = await response.json().catch(() => null);
      const message = extractErrorMessage(body) || `API Error: ${response.statusText}`;
      throw new ApiError(
        message,
        response.status,
        extractErrorCode(body) ?? (response.status === 404 ? "not_found" : "api_error"),
      );
    }

    const data = await response.json();

    // Check for API response format (success/error envelope)
    if (data && typeof data === "object") {
      if ("success" in data && !data.success) {
        throw new ApiError(
          extractErrorMessage(data) || "API returned error",
          response.status,
          extractErrorCode(data) ?? "api_error",
        );
      }
      // Extract data from response envelope if present
      if ("data" in data && "success" in data) {
        return data.data as T;
      }
    }

    return data as T;
  } catch (error) {
    // If using mock data fallback and error occurs, return fallback
    if (USE_MOCK_DATA && fallbackData) {
      console.warn(`API call failed for ${endpoint}, using mock data`, error);
      return fallbackData;
    }

    if (error instanceof ApiError) throw error;

    throw new ApiError(
      error instanceof Error ? error.message : "Unknown error",
      500,
      "network_error",
    );
  }
}

/**
 * Resolve - Main data access function
 * Routes to backend API if available and not using mock mode
 * Falls back to provided mock data if API unavailable
 */
export async function resolve<T>(
  data: T,
  endpoint?: string,
  options?: RequestInit,
  latency = MOCK_LATENCY_MS,
): Promise<T> {
  // If no endpoint specified or explicitly using mock data, return mock data
  if (!endpoint || USE_MOCK_DATA) {
    if (latency > 0 && typeof window !== "undefined") {
      await new Promise((r) => setTimeout(r, latency));
    }
    return structuredClone(data);
  }

  // Try to fetch from backend API with mock data as fallback
  return fetchApi(endpoint, options, data);
}

/**
 * POST request that returns the full response envelope
 * ({success, data, token?, message?}) instead of unwrapping to just
 * `data` - the backend's auth endpoints put `token` as a sibling of
 * `data`, not nested inside it, so the normal post()/fetchApi()
 * unwrapping silently drops it.
 */
export async function postEnvelope<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || (data && typeof data === "object" && "success" in data && !data.success)) {
    const message =
      (data && typeof data === "object" && (data.error?.message ?? data.message)) ||
      `API Error: ${response.statusText}`;
    throw new ApiError(message, response.status, response.status === 401 ? "invalid_credentials" : "api_error");
  }

  return data as T;
}

/**
 * POST request wrapper
 */
export async function post<T>(
  endpoint: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">,
): Promise<T> {
  return fetchApi<T>(
    endpoint,
    {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/**
 * PUT request wrapper
 */
export async function put<T>(
  endpoint: string,
  body: unknown,
  options?: Omit<RequestInit, "method" | "body">,
): Promise<T> {
  return fetchApi<T>(
    endpoint,
    {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
}

/**
 * GET request wrapper
 */
export async function get<T>(
  endpoint: string,
  options?: Omit<RequestInit, "method">,
): Promise<T> {
  return fetchApi<T>(
    endpoint,
    {
      ...options,
      method: "GET",
    },
  );
}
