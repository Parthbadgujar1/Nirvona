import type { Role } from "@/types";
import { ApiError, postEnvelope } from "./http";

export interface LoginRequest {
  email?: string;
  mobile?: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  mobile: string;
  className: string;
  school: string;
  city: string;
  state: string;
  password: string;
}

export interface Session {
  role: Role;
  name: string;
  email: string;
  id: string;
  token?: string;
}

interface LoginEnvelope {
  success: boolean;
  data: {
    id: string;
    fullName?: string;
    name?: string;
    email: string;
    adminRole?: string;
  };
  token: string;
  message?: string;
}

interface RegisterEnvelope {
  success: boolean;
  data: { id: string; fullName: string; email: string };
  token: string;
  message?: string;
}

/**
 * Authentication Service - Backend Integrated
 *
 * Routes:
 * - POST /api/auth/login - Student login (email + password)
 * - POST /api/auth/admin/login - Admin login (email + password)
 * - POST /api/students/register - Student registration (also returns a token)
 *
 * There's a single login form for both roles (no role selector in the
 * UI), so this tries the student endpoint first and falls back to the
 * admin one - mirroring the old mock version's "guess admin from the
 * identifier text" heuristic, but by actually asking the backend
 * instead of pattern-matching the email string.
 */
export const authService = {
  /**
   * Login with email and password. (Backend only supports email lookup
   * right now, not mobile - a mobile number here will fail cleanly with
   * "Invalid email or password" rather than crash.)
   */
  login: async (identifier: string, password: string): Promise<Session> => {
    if (!identifier.trim() || password.length < 4) {
      throw new ApiError("Enter a valid email/mobile and password.", 401, "invalid_credentials");
    }

    try {
      const res = await postEnvelope<LoginEnvelope>("/auth/login", {
        email: identifier,
        password,
      });
      return {
        role: "student",
        name: res.data.fullName || res.data.email,
        email: res.data.email,
        id: res.data.id,
        token: res.token,
      };
    } catch (studentError) {
      try {
        const res = await postEnvelope<LoginEnvelope>("/auth/admin/login", {
          email: identifier,
          password,
        });
        return {
          role: "admin",
          name: res.data.name || res.data.email,
          email: res.data.email,
          id: res.data.id,
          token: res.token,
        };
      } catch {
        // Surface the original (student-login) error - it's the more
        // relevant one for a typical login attempt.
        throw studentError instanceof ApiError
          ? studentError
          : new ApiError("Invalid email or password.", 401, "invalid_credentials");
      }
    }
  },

  /**
   * Register new student. Backend creates the account and, on success,
   * logs them straight in (returns a token alongside the profile).
   */
  register: async (payload: RegisterRequest): Promise<{ studentId: string; email: string; token: string }> => {
    const res = await postEnvelope<RegisterEnvelope>("/students/register", payload);
    return { studentId: res.data.id, email: res.data.email, token: res.token };
  },

  /**
   * Logout - JWTs are stateless, so there's nothing for the server to
   * invalidate. Clearing the locally stored session (see useSession) is
   * the entire logout; no network call needed.
   */
  logout: async () => {
    return { ok: true };
  },
};
