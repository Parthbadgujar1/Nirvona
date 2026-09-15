"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@/services/auth.service";
import { authService } from "@/services/auth.service";
import { CURRENT_ADMIN, CURRENT_STUDENT } from "@/data/students";
import { USE_MOCK_DATA, SESSION_STORAGE_KEY } from "@/services/http";
import { useLocalStorage } from "./use-local-storage";

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
 * Real, backend-authenticated session when NEXT_PUBLIC_USE_MOCK_DATA is
 * false (the default now that the backend exists) - signIn()/signOut()
 * call the real /api/auth/* endpoints and persist the JWT alongside the
 * profile. Falls back to a fabricated demo session only in mock mode,
 * where there's no backend to actually authenticate against.
 *
 * Previously this *always* fell back to a fake logged-in session with
 * a mock id, even with the real backend wired up and even for a visitor
 * who'd never signed in - every dashboard page silently "worked" against
 * data for a student that doesn't exist, and isAuthenticated was the
 * only way to tell the session wasn't real.
 */
export function useSession(fallback: "student" | "admin" = "student") {
  const { value, setValue, clear, hydrated } = useLocalStorage<Session | null>(SESSION_STORAGE_KEY, null);
  const navigate = useNavigate();

  const session = value ?? (USE_MOCK_DATA ? (fallback === "admin" ? DEMO_ADMIN : DEMO_STUDENT) : null);

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
    navigate("/login");
  }, [clear, navigate]);

  return { session, isAuthenticated: Boolean(value), hydrated, signIn, signOut, setSession: setValue };
}
