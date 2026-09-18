import { COURSES, getCourse as getMockCourse } from "@/data/courses";
import { PACKAGES, getPackage, packagesForCourse } from "@/data/packages";
import type { Course, CourseSlug, Package, SyllabusUnit } from "@/types";
import { ApiError, USE_MOCK_DATA, get, resolve } from "./http";

/** A row of GET /api/courses/{slug}/syllabus (one unit of one subject). */
interface SyllabusRow {
  subject: string;
  unitTitle: string;
  topics: string[] | null;
  orderIndex?: number;
}

/**
 * The syllabus table stores one flat row per unit; the course page
 * renders subject -> units -> topics. Order follows the API's
 * orderIndex, and a subject's position is where its first unit appears.
 */
function groupSyllabus(rows: SyllabusRow[]): SyllabusUnit[] {
  const bySubject = new Map<string, SyllabusUnit>();
  for (const row of rows) {
    let entry = bySubject.get(row.subject);
    if (!entry) {
      entry = { subject: row.subject, units: [] };
      bySubject.set(row.subject, entry);
    }
    entry.units.push({ title: row.unitTitle, topics: row.topics ?? [] });
  }
  return [...bySubject.values()];
}

/**
 * Courses and packages are fully database-driven: everything an admin
 * edits in Admin -> Courses / Packages (name, tagline, description,
 * highlights, exam pattern, FAQs, subjects, syllabus, prices, features,
 * status, ...) is what every public page and the student portal render.
 *
 * `listCourses` / `listPackages` / `packagesForCourse` / `getPackage`
 * return only *active* rows (retiring a course or package in the admin
 * panel removes it from the public site); the mock arrays are used only
 * when the app is explicitly run in mock mode (VITE_USE_MOCK_DATA=true).
 */
export const catalogueService = {
  listCourses: (): Promise<Course[]> => resolve(COURSES, "/courses"),

  /**
   * One course with its full marketing content. Merges GET
   * /courses/{slug} (the course row + subjects) with GET
   * /courses/{slug}/syllabus. Resolves `undefined` for an unknown or
   * retired course so the page can show "not found".
   */
  getCourse: async (slug: string): Promise<Course | undefined> => {
    if (USE_MOCK_DATA) return getMockCourse(slug);
    try {
      const [course, syllabusRows] = await Promise.all([
        get<Course>(`/courses/${slug}`),
        get<SyllabusRow[]>(`/courses/${slug}/syllabus`).catch(() => [] as SyllabusRow[]),
      ]);
      return {
        ...course,
        audience: course.audience ?? [],
        subjects: course.subjects ?? [],
        highlights: course.highlights ?? [],
        examPattern: course.examPattern ?? [],
        patternNotes: course.patternNotes ?? [],
        faqs: course.faqs ?? [],
        stats: course.stats ?? [],
        description: course.description ?? "",
        tagline: course.tagline ?? "",
        syllabus: groupSyllabus(syllabusRows),
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return undefined;
      throw error;
    }
  },

  listPackages: (): Promise<Package[]> => resolve(PACKAGES, "/packages"),
  getPackage: (id: string): Promise<Package | undefined> => resolve(getPackage(id), `/packages/${id}`),
  packagesForCourse: (slug: CourseSlug): Promise<Package[]> =>
    resolve(packagesForCourse(slug), `/courses/${slug}/packages`),
};

/* Synchronous accessors for server components that render static catalogue data. */
export const catalogue = { COURSES, PACKAGES, getCourse: getMockCourse, getPackage, packagesForCourse };
