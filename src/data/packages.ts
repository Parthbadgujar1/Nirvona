import type { CourseSlug, Package, PackageDuration } from "@/types";

/**
 * Duration policy (enforced here so the UI can never offer an invalid package):
 *   Class 11 · JEE · NEET  → up to 24 months
 *   Class 12 · Devoter     → up to 12 months
 */
export const MAX_DURATION: Record<CourseSlug, 12 | 24> = {
  "class-11": 24,
  "class-12": 12,
  devoter: 12,
  jee: 24,
  neet: 24,
};

const DURATION_META: Record<PackageDuration, { label: string; months: number }> = {
  "3M": { label: "3 Months", months: 3 },
  "6M": { label: "6 Months", months: 6 },
  "1Y": { label: "1 Year", months: 12 },
  "2Y": { label: "2 Years", months: 24 },
};

interface Blueprint {
  duration: PackageDuration;
  price: number;
  originalPrice?: number;
  tests: number;
  tagline: string;
  recommended?: boolean;
  includes: Package["includes"];
  features: string[];
  benefits: string[];
}

const base = (over: Partial<Package["includes"]> = {}): Package["includes"] => ({
  examAccess: true,
  analytics: true,
  answerKey: true,
  doubtSupport: false,
  mentorship: false,
  printedMaterial: false,
  ...over,
});

function blueprints(course: CourseSlug, testsPerYear: number): Blueprint[] {
  const priceTable: Record<CourseSlug, number> = {
    "class-11": 2999,
    "class-12": 3499,
    devoter: 2499,
    jee: 4499,
    neet: 4499,
  };
  const q = priceTable[course];
  const list: Blueprint[] = [
    {
      duration: "3M",
      price: q,
      originalPrice: Math.round(q * 1.34),
      tests: Math.round(testsPerYear / 4),
      tagline: "Try the full Nirvona examination system for a quarter.",
      includes: base(),
      features: [
        `${Math.round(testsPerYear / 4)} CBT examinations`,
        "Full performance analytics",
        "Answer key after every exam",
        "All-India rank & percentile",
      ],
      benefits: [
        "Experience the real CBT interface before committing long term",
        "Get a baseline diagnostic of your current standing",
        "Ideal for students joining mid-session",
      ],
    },
    {
      duration: "6M",
      price: Math.round(q * 1.75),
      originalPrice: Math.round(q * 2.4),
      tests: Math.round(testsPerYear / 2),
      tagline: "A half-session runway with doubt support included.",
      includes: base({ doubtSupport: true }),
      features: [
        `${Math.round(testsPerYear / 2)} CBT examinations`,
        "Full performance analytics",
        "Topic-level weakness reports",
        "Doubt support (48h response)",
        "All-India rank & percentile",
      ],
      benefits: [
        "Enough tests to establish a measurable improvement trend",
        "Doubt resolution on every incorrect response",
        "Priority seat allocation at your preferred exam centre",
      ],
    },
    {
      duration: "1Y",
      price: Math.round(q * 3),
      originalPrice: Math.round(q * 4.6),
      tests: testsPerYear,
      recommended: true,
      tagline: "The complete academic session. Our most chosen package.",
      includes: base({ doubtSupport: true, mentorship: true }),
      features: [
        `${testsPerYear} CBT examinations`,
        "Advanced analytics with trend tracking",
        "Topic & chapter priority ranking",
        "Doubt support (24h response)",
        "1:1 mentor review every quarter",
        "All-India rank & percentile",
      ],
      benefits: [
        "Full-session coverage with no syllabus gaps",
        "Quarterly mentor calls to reset your strategy",
        "Complete score, rank and percentile history",
        "Best value per examination",
      ],
    },
  ];

  if (MAX_DURATION[course] === 24) {
    list.push({
      duration: "2Y",
      price: Math.round(q * 5.2),
      originalPrice: Math.round(q * 8.4),
      tests: testsPerYear * 2,
      tagline: "Two full sessions — start in Class 11, finish exam-ready.",
      includes: base({ doubtSupport: true, mentorship: true, printedMaterial: true }),
      features: [
        `${testsPerYear * 2} CBT examinations`,
        "Two-year longitudinal analytics",
        "Doubt support (12h priority response)",
        "Monthly 1:1 mentor review",
        "Printed revision compendium",
        "Guaranteed centre allocation",
      ],
      benefits: [
        "Uninterrupted two-year preparation with a single enrolment",
        "Year-on-year improvement tracking across both sessions",
        "Lowest effective cost per examination",
        "Priority support and centre selection",
      ],
    });
  }

  return list;
}

const TESTS_PER_YEAR: Record<CourseSlug, number> = {
  "class-11": 24,
  "class-12": 32,
  devoter: 24,
  jee: 30,
  neet: 28,
};

const COURSE_NAMES: Record<CourseSlug, string> = {
  "class-11": "Class 11 Foundation",
  "class-12": "Class 12 Accelerator",
  devoter: "Devoter",
  jee: "JEE Advantage",
  neet: "NEET Advantage",
};

export const PACKAGES: Package[] = (Object.keys(MAX_DURATION) as CourseSlug[]).flatMap((course) =>
  blueprints(course, TESTS_PER_YEAR[course]).map((bp) => {
    const meta = DURATION_META[bp.duration];
    const discountPercent = bp.originalPrice
      ? Math.round(((bp.originalPrice - bp.price) / bp.originalPrice) * 100)
      : undefined;
    return {
      id: `PKG-${course.toUpperCase().replace(/-/g, "")}-${bp.duration}`,
      courseSlug: course,
      name: `${COURSE_NAMES[course]} — ${meta.label}`,
      duration: bp.duration,
      durationLabel: meta.label,
      durationMonths: meta.months,
      price: bp.price,
      originalPrice: bp.originalPrice,
      discountPercent,
      tests: bp.tests,
      recommended: bp.recommended,
      tagline: bp.tagline,
      features: bp.features,
      benefits: bp.benefits,
      includes: bp.includes,
    } satisfies Package;
  }),
);

export function getPackage(id: string): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function packagesForCourse(slug: CourseSlug): Package[] {
  return PACKAGES.filter((p) => p.courseSlug === slug);
}

export const PACKAGE_MAP = Object.fromEntries(PACKAGES.map((p) => [p.id, p]));
