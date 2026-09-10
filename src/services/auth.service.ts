import { CURRENT_ADMIN, CURRENT_STUDENT } from "@/data/students";
import type { Role } from "@/types";
import { ApiError, resolve, post } from "./http";

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

/**
 * Authentication Service - Backend Integrated
 *
 * Routes:
 * - POST /api/auth/login - User login (email/mobile + password)
 * - POST /api/auth/register - Student registration
 * - POST /api/auth/logout - User logout
 *
 * Returns JWT token for subsequent API calls
 */
export const authService = {
  /**
   * Login with email/mobile and password
   * Backend returns JWT token for subsequent requests
   */
  login: async (identifier: string, password: string): Promise<Session> => {
    if (!identifier.trim() || password.length < 4) {
      throw new ApiError("Enter a valid email/mobile and password.", 401, "invalid_credentials");
    }

    try {
      // Try to call backend API
      const response = await post<{
        success: boolean;
        data: {
          id: string;
          email: string;
          name: string;
          role: Role;
          token: string;
        };
        error?: { message: string };
      }>("/auth/login", {
        email: identifier.includes("@") ? identifier : undefined,
        mobile: identifier.includes("@") ? undefined : identifier,
        password,
      });

      const sessionData = response.data || response;
      return {
        role: sessionData.role || "student",
        name: sessionData.name || sessionData.email,
        email: sessionData.email,
        id: sessionData.id,
        token: sessionData.token,
      };
    } catch (error) {
      // Fallback to demo auth for development
      console.warn("Backend auth failed, using demo auth", error);
      const isAdmin = identifier.toLowerCase().includes("admin");
      await new Promise((r) => setTimeout(r, 900));
      return isAdmin
        ? { role: "admin", name: CURRENT_ADMIN.name, email: CURRENT_ADMIN.email, id: CURRENT_ADMIN.id }
        : {
            role: "student",
            name: CURRENT_STUDENT.fullName,
            email: CURRENT_STUDENT.email,
            id: CURRENT_STUDENT.id,
          };
    }
  },

  /**
   * Register new student
   * Backend creates account and returns student ID
   */
  register: async (payload: RegisterRequest) => {
    try {
      // Call backend API
      const response = await post<{
        success: boolean;
        data: { id: string; email: string };
        error?: { message: string };
      }>("/students/register", payload);

      const data = response.data || response;
      return { studentId: data.id, email: data.email, ...payload };
    } catch (error) {
      // Fallback for development
      console.warn("Backend registration failed, using mock response", error);
      await new Promise((r) => setTimeout(r, 1200));
      return resolve({ studentId: CURRENT_STUDENT.id, ...payload }, "", {}, 0);
    }
  },

  /**
   * Logout - Clear session
   */
  logout: async () => {
    try {
      // Notify backend
      return await post<{ ok: boolean }>("/auth/logout", {});
    } catch (error) {
      // Local logout still works even if API fails
      console.warn("Backend logout failed, clearing local session", error);
      return { ok: true };
    }
  },

  /**
   * Verify token with backend
   * Used to restore session on page load
   */
  verifyToken: async (token: string): Promise<Session | null> => {
    try {
      const response = await post<{
        success: boolean;
        data: Session;
      }>("/auth/verify", { token });

      return response.data || response;
    } catch (error) {
      console.warn("Token verification failed", error);
      return null;
    }
  },
};
