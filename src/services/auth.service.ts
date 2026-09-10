import { CURRENT_ADMIN, CURRENT_STUDENT } from "@/data/students";
import type { Role } from "@/types";
import { ApiError, resolve } from "./http";

export interface Session {
  role: Role;
  name: string;
  email: string;
  id: string;
}

/**
 * Demo authentication. There is no real credential check here and no token is
 * issued — a backend must own that. The prototype simply routes by role so both
 * portals can be explored.
 */
export const authService = {
  login: async (identifier: string, password: string): Promise<Session> => {
    if (!identifier.trim() || password.length < 4) {
      throw new ApiError("Enter a valid email/mobile and password.", 401, "invalid_credentials");
    }
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
  },
  register: async (payload: Record<string, unknown>) => {
    await new Promise((r) => setTimeout(r, 1200));
    return resolve({ studentId: CURRENT_STUDENT.id, ...payload }, 0);
  },
  logout: async () => resolve({ ok: true }, 200),
};
