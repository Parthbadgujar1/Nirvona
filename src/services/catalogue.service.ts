import { COURSES, getCourse } from "@/data/courses";
import { PACKAGES, getPackage, packagesForCourse } from "@/data/packages";
import type { Course, CourseSlug, Package } from "@/types";
import { resolve } from "./http";

/**
 * Packages are real (id, price, features, ...) - they come from the
 * `packages` table via GET /api/packages, /api/packages/{id} and
 * /api/courses/{slug}/packages, and checkout depends on that id being
 * a real UUID the backend recognizes. Course *catalogue* content
 * (syllabus, exam pattern breakdown, FAQs) stays on the bundled
 * `COURSES` data for now - the backend's `courses` table doesn't yet
 * store that shape (see the courseSlugs/packageIds follow-up task) and
 * every currently-seeded package's courseSlug lines up with a mock
 * course of the same slug, so pairing real packages with mock course
 * descriptions renders correctly without pretending catalogue copy is
 * database-driven when it isn't.
 */
export const catalogueService = {
  // Real (id/slug list only matters here - e.g. the exam-creation
  // form's course picker, which must only offer courses that actually
  // exist server-side or saving violates the exams.courseSlug foreign
  // key). Marketing pages needing full course copy use `getCourse`
  // below, which intentionally stays on the mock catalogue.
  listCourses: (): Promise<Course[]> => resolve(COURSES, "/courses"),
  getCourse: (slug: string): Promise<Course | undefined> => resolve(getCourse(slug)),
  listPackages: (): Promise<Package[]> => resolve(PACKAGES, "/packages"),
  getPackage: (id: string): Promise<Package | undefined> => resolve(getPackage(id), `/packages/${id}`),
  packagesForCourse: (slug: CourseSlug): Promise<Package[]> =>
    resolve(packagesForCourse(slug), `/courses/${slug}/packages`),
};

/* Synchronous accessors for server components that render static catalogue data. */
export const catalogue = { COURSES, PACKAGES, getCourse, getPackage, packagesForCourse };
