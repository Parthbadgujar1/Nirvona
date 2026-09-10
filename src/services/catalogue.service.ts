import { COURSES, getCourse } from "@/data/courses";
import { PACKAGES, getPackage, packagesForCourse } from "@/data/packages";
import type { Course, CourseSlug, Package } from "@/types";
import { resolve } from "./http";

export const catalogueService = {
  listCourses: (): Promise<Course[]> => resolve(COURSES),
  getCourse: (slug: string): Promise<Course | undefined> => resolve(getCourse(slug)),
  listPackages: (): Promise<Package[]> => resolve(PACKAGES),
  getPackage: (id: string): Promise<Package | undefined> => resolve(getPackage(id)),
  packagesForCourse: (slug: CourseSlug): Promise<Package[]> => resolve(packagesForCourse(slug)),
};

/* Synchronous accessors for server components that render static catalogue data. */
export const catalogue = { COURSES, PACKAGES, getCourse, getPackage, packagesForCourse };
