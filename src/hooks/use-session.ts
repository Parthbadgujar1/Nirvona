"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/services/auth.service";
import { authService } from "@/services/auth.service";
import { CURRENT_ADMIN, CURRENT_STUDENT } from "@/data/students";
import { useLocalStorage } from "./use-local-storage";

const KEY = "nirvona.session";

const DEMO_STUDENT: Session = {
  role: "student",
  name: CURRENT_STUDENT.fullName,
  email: CURRENT_STUDENT.email,
  id: CURRENT_STUDENT.id,
};

const DEMO_ADMIN: Session = {
  role: "admin",
  name: CURRENT_ADMIN.name,
  email: CURRENT_ADMIN.email,
  id: CURRENT_ADMIN.id,
};

/**
 * Demo session. A real build replaces this with an httpOnly-cookie session and
 * a server-side guard on the /student and /admin route groups.
 */
export function useSession(fallback: "student" | "admin" = "student") {
  const { value, setValue, clear, hydrated } = useLocalStorage<Session | null>(KEY, null);
  const router = useRouter();

  const session = value ?? (fallback === "admin" ? DEMO_ADMIN : DEMO_STUDENT);

  const signIn = React.useCallback(
    async (identifier: string, password: string) => {
      const next = await authService.login(identifier, password);
      setValue(next);
      return next;
    },
    [setValue],
  );

  const signOut = React.useCallback(async () => {
    await authService.logout();
    clear();
    router.push("/login");
  }, [clear, router]);

  return { session, isAuthenticated: Boolean(value), hydrated, signIn, signOut, setSession: setValue };
}
