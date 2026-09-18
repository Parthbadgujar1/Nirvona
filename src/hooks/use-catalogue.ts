"use client";

import * as React from "react";
import { useAsync } from "@/hooks/use-async";
import { catalogueService } from "@/services/catalogue.service";
import type { Course, Package } from "@/types";

/**
 * Live course catalogue (GET /api/courses - active courses only).
 *
 * Every page that used to import the bundled `COURSES` array (navbar,
 * footer, registration, packages, the student portal, ...) reads from
 * here instead, so a course an admin edits, adds, deactivates or deletes
 * shows up everywhere on the next load rather than only where a page
 * happened to be wired to the API.
 */
export function useCourses() {
  const state = useAsync(() => catalogueService.listCourses(), []);
  const courses = React.useMemo(() => state.data ?? [], [state.data]);
  const bySlug = React.useMemo(() => new Map(courses.map((c) => [c.slug, c])), [courses]);
  const getCourse = React.useCallback((slug?: string | null): Course | undefined => (slug ? bySlug.get(slug) : undefined), [bySlug]);
  return { courses, getCourse, status: state.status, reload: state.reload };
}

/** Live package catalogue (GET /api/packages - active packages only). */
export function usePackages() {
  const state = useAsync(() => catalogueService.listPackages(), []);
  const packages = React.useMemo(() => state.data ?? [], [state.data]);
  const byId = React.useMemo(() => new Map(packages.map((p) => [p.id, p])), [packages]);
  const getPackage = React.useCallback((id?: string | null): Package | undefined => (id ? byId.get(id) : undefined), [byId]);
  return { packages, getPackage, status: state.status, reload: state.reload };
}
