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

/** What to tell a person when the server sent no message of its own. Never the raw HTTP status text. */
function statusMessage(status: number): string {
  if (status === 401) return "Your session is invalid or has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find what you were looking for.";
  if (status === 413) return "That is too large to send.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The server had a problem. Please try again in a moment.";
  return "Something went wrong. Please try again.";
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
 * Short-lived cache of successful GET responses, so moving between pages
 * (dashboard -> programs -> back) does not re-download data the app fetched
 * a moment ago. Deliberately brief and self-clearing:
 *  - the public catalogue lives a little longer (it changes rarely and the
 *    server also caches it for ~10 s),
 *  - signed-in data only a few seconds,
 *  - ANY write (POST/PUT/DELETE) empties the whole cache, and so does signing
 *    in or out, so a page never shows something the user just changed.
 * Keyed per token, so one account's data is never served to another.
 */
const responseCache = new Map<string, { at: number; data: unknown }>();
const PUBLIC_TTL_MS = 20_000;
const PRIVATE_TTL_MS = 6_000;
const MAX_CACHE_ENTRIES = 200;

const isPublicCatalogue = (endpoint: string) =>
  /^\/(courses|packages|subjects)(\/|$|\?)/.test(endpoint);

export function clearApiCache(): void {
  responseCache.clear();
}

/** Same-tab signal the session hook listens to (see use-local-storage.ts). */
const STORAGE_SYNC_EVENT = "nirvona:storage-sync";

/**
 * The backend rejected our token (expired, revoked because the account was
 * deactivated, or signed with a rotated secret). Drop the stored session so
 * the portal shell sends the user back to sign in, instead of leaving them
 * on a page where every request fails.
 */
function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  responseCache.clear();
  try {
    if (window.localStorage.getItem(SESSION_STORAGE_KEY)) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, { detail: { key: SESSION_STORAGE_KEY } }));
    }
  } catch {
    /* storage unavailable - nothing to clear */
  }
}

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

  if (method !== "GET") {
    // Any write may change what a GET returns: never serve a stale copy after it.
    responseCache.clear();
    return fetchApiUncached<T>(endpoint, options, fallbackData, token).finally(() => responseCache.clear());
  }

  if (dedupeKey) {
    const cached = responseCache.get(dedupeKey);
    const ttl = isPublicCatalogue(endpoint) ? PUBLIC_TTL_MS : PRIVATE_TTL_MS;
    if (cached && Date.now() - cached.at < ttl) {
      // A copy, so a component that sorts/mutates its result can't corrupt the cache.
      return structuredClone(cached.data) as T;
    }
    const existing = inFlightGets.get(dedupeKey);
    if (existing) return existing as Promise<T>;
  }

  // A read that hits the server's rate limit (many tabs, a busy shared network)
  // is retried once after a short pause instead of showing an error screen.
  const attempt = () => fetchApiUncached<T>(endpoint, options, fallbackData, token);
  const withRetry = () =>
    attempt().catch(async (error: unknown) => {
      if (error instanceof ApiError && error.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        return attempt();
      }
      throw error;
    });

  const request = withRetry().then((data) => {
    if (dedupeKey) {
      if (responseCache.size >= MAX_CACHE_ENTRIES) responseCache.clear();
      responseCache.set(dedupeKey, { at: Date.now(), data: structuredClone(data) });
    }
    return data;
  });

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
  /** Return the whole {success, data, meta} envelope instead of just `data` (used for paging). */
  envelope = false,
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
      if (response.status === 401 && token) handleUnauthorized();
      const message = extractErrorMessage(body) || statusMessage(response.status);
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
      if (envelope) return data as T;
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
 * Every row of a paginated list endpoint (the admin lists for students,
 * payments, enrolments...).
 *
 * The API returns 20 rows per page by default and reports the real total in
 * `meta.total`. Screens that call `get("/admin/students")` and ignore that
 * silently show only the first 20 of, say, 1,000 students - and search or
 * filter only within those 20. This reads the total from the first page,
 * fetches the remaining pages a few at a time, and returns them all, so the
 * existing search/sort/filter tables keep working over the complete list.
 */
export async function getAllPages<T extends { id?: string }>(
  endpoint: string,
  { pageSize = 500, maxRows = 20_000 }: { pageSize?: number; maxRows?: number } = {},
): Promise<T[]> {
  const token = getStoredToken();
  const cacheKey = `${token ?? ""}:ALL:${endpoint}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.at < PRIVATE_TTL_MS) return structuredClone(cached.data) as T[];
  // Several components on one screen often ask for the same list at once:
  // share the single load instead of downloading it once per component.
  const existing = inFlightGets.get(cacheKey);
  if (existing) return (await existing) as T[];

  const load = (async () => {
    const sep = endpoint.includes("?") ? "&" : "?";
    const page = (n: number) =>
      fetchApiUncached<{ data: T[]; meta?: { total?: number } }>(
        `${endpoint}${sep}page=${n}&pageSize=${pageSize}`,
        undefined,
        undefined,
        token,
        true,
      );

    const first = await page(1);
    const rows: T[] = [...(first.data ?? [])];
    const total = Math.min(first.meta?.total ?? rows.length, maxRows);
    const pages = Math.ceil(total / pageSize);

    const rest = Array.from({ length: Math.max(0, pages - 1) }, (_, i) => i + 2);
    for (let i = 0; i < rest.length; i += 4) {
      const batch = await Promise.all(rest.slice(i, i + 4).map(page));
      for (const b of batch) rows.push(...(b.data ?? []));
    }

    // A row inserted while we were paging can shift a boundary: drop duplicates.
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (!r.id) return true;
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    if (responseCache.size >= MAX_CACHE_ENTRIES) responseCache.clear();
    responseCache.set(cacheKey, { at: Date.now(), data: structuredClone(unique) });
    return unique;
  })();

  inFlightGets.set(cacheKey, load);
  load.finally(() => inFlightGets.delete(cacheKey)).catch(() => {});
  return load;
}

/** `resolve()` for paginated lists: mock data in mock mode, otherwise every page from the API. */
export async function resolveAll<T extends { id?: string }>(data: T[], endpoint: string): Promise<T[]> {
  if (USE_MOCK_DATA) return structuredClone(data);
  return getAllPages<T>(endpoint);
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
    // The backend sends errors in two shapes ({error: "text"} and
    // {error: {code, message}}); extractErrorMessage understands both. This
    // used to read only the second, so a wrong password surfaced as the HTTP
    // status text - "API Error: Unauthorized" - instead of the server's
    // "Invalid email or password".
    const message =
      extractErrorMessage(data) ||
      (response.status === 401
        ? "Invalid email or password."
        : response.status === 429
          ? "Too many attempts. Please wait a few minutes and try again."
          : statusMessage(response.status));
    throw new ApiError(
      message,
      response.status,
      extractErrorCode(data) ?? (response.status === 401 ? "invalid_credentials" : "api_error"),
    );
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

/**
 * DELETE request wrapper
 */
export async function del<T>(
  endpoint: string,
  options?: Omit<RequestInit, "method" | "body">,
): Promise<T> {
  return fetchApi<T>(
    endpoint,
    {
      ...options,
      method: "DELETE",
    },
  );
}
