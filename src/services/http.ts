/**
 * HTTP Client Layer - Nirvona Frontend
 *
 * All frontend services call methods in this file for data access.
 * Automatically routes to backend API when available, falls back to mock data.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export const MOCK_LATENCY_MS = 220;

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
 * Fetch wrapper with error handling and response transformation
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackData?: T,
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        `API Error: ${response.statusText}`,
        response.status,
        response.status === 404 ? "not_found" : "api_error",
      );
    }

    const data = await response.json();

    // Check for API response format (success/error envelope)
    if (data && typeof data === "object") {
      if ("success" in data && !data.success) {
        throw new ApiError(
          data.error?.message || "API returned error",
          data.error?.code || 400,
          "api_error",
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
