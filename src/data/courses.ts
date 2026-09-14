import type { Course, Subject } from "@/types";

export const SUBJECTS: Record<string, Subject> = {
  physics: { code: "PHY", name: "Physics", color: "#2563eb" },
  chemistry: { code: "CHE", name: "Chemistry", color: "#f95c14" },
  maths: { code: "MAT", name: "Mathematics", color: "#0e1d4a" },
  biology: { code: "BIO", name: "Biology", color: "#10b981" },
  sanskrit: { code: "SAN", name: "Sanskrit & Scriptures", color: "#7c3aed" },
  philosophy: { code: "PHL", name: "Indian Philosophy", color: "#d97706" },
  general: { code: "GEN", name: "General Aptitude", color: "#6b7488" },
};

const jeePattern = [
  { section: "Physics", questions: 30, marks: 120, type: "25 MCQ + 5 Numerical", negative: "-1 on MCQ" },
  { section: "Chemistry", questions: 30, marks: 120, type: "25 MCQ + 5 Numerical", negative: "-1 on MCQ" },
  { section: "Mathematics", questions: 30, marks: 120, type: "25 MCQ + 5 Numerical", negative: "-1 on MCQ" },
];

const neetPattern = [
  { section: "Physics", questions: 45, marks: 180, type: "Single correct MCQ", negative: "-1" },
  { section: "Chemistry", questions: 45, marks: 180, type: "Single correct MCQ", negative: "-1" },
  { section: "Biology (Botany + Zoology)", questions: 90, marks: 360, type: "Single correct MCQ", negative: "-1" },
];

const schoolPattern = [
  { section: "Physics", questions: 30, marks: 120, type: "MCQ + Assertion-Reason", negative: "-1" },
  { section: "Chemistry", questions: 30, marks: 120, type: "MCQ + Assertion-Reason", negative: "-1" },
  { section: "Mathematics / Biology", questions: 30, marks: 120, type: "MCQ + Numerical", negative: "-1" },
];

export const COURSES: Course[] = [
  {
    slug: "class-11",
    name: "Class 11 Foundation",
    shortName: "Class 11",
    tagline: "Build the base that carries you through Class 12 and beyond.",
    description:
      "A structured, chapter-synchronised CBT programme for Class 11 students. Every test mirrors the board + competitive blueprint so concepts are tested the way real examinations test them — not the way textbooks list them.",
    audience: [
      "Students entering or currently in Class 11 (Science stream)",
      "Aspirants planning a two-year JEE or NEET preparation runway",
      "Students who want board-aligned testing with competitive rigour",
    ],
    subjects: [SUBJECTS.physics, SUBJECTS.chemistry, SUBJECTS.maths, SUBJECTS.biology],
    maxDurationMonths: 24,
    totalTests: 48,
    accent: "royal",
    icon: "Sparkles",
    highlights: [
      "Chapter-wise, unit-wise and full-syllabus CBT tests",
      "Board + competitive blueprint in a single paper",
      "Concept-gap detection from the very first test",
      "Two-year continuity option with Class 12 syllabus rollover",
    ],
    examPattern: schoolPattern,
    patternNotes: [
      "Duration: 180 minutes · Total 90 questions · 360 marks",
      "Computer-based, single-session, offline centre examination",
      "Choice of Mathematics or Biology as the third subject",
      "Question navigation, review-marking and auto-submit as in national CBT exams",
    ],
    syllabus: [
      {
        subject: "Physics",
        units: [
          { title: "Mechanics", topics: ["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation"] },
          { title: "Properties of Matter", topics: ["Elasticity", "Fluid Mechanics", "Thermal Properties", "Kinetic Theory"] },
          { title: "Oscillations & Waves", topics: ["SHM", "Wave Motion", "Superposition", "Doppler Effect"] },
        ],
      },
      {
        subject: "Chemistry",
        units: [
          { title: "Physical Chemistry", topics: ["Mole Concept", "Atomic Structure", "Thermodynamics", "Equilibrium", "Redox Reactions"] },
          { title: "Inorganic Chemistry", topics: ["Periodic Table", "Chemical Bonding", "s-Block", "p-Block (Group 13-14)", "Hydrogen"] },
          { title: "Organic Chemistry", topics: ["GOC", "Isomerism", "Hydrocarbons", "Environmental Chemistry"] },
        ],
      },
      {
        subject: "Mathematics",
        units: [
          { title: "Algebra", topics: ["Sets & Relations", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Binomial Theorem", "Permutations & Combinations"] },
          { title: "Trigonometry", topics: ["Trigonometric Functions", "Identities & Equations", "Properties of Triangles"] },
          { title: "Coordinate Geometry", topics: ["Straight Lines", "Circles", "Conic Sections"] },
          { title: "Calculus", topics: ["Limits", "Derivatives (Introduction)"] },
        ],
      },
      {
        subject: "Biology",
        units: [
          { title: "Diversity of Life", topics: ["Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom"] },
          { title: "Structural Organisation", topics: ["Morphology", "Anatomy", "Animal Tissues"] },
          { title: "Cell & Physiology", topics: ["Cell Cycle", "Biomolecules", "Plant Physiology", "Human Physiology"] },
        ],
      },
    ],
    faqs: [
      { q: "Can I choose between Mathematics and Biology?", a: "Yes. At enrolment you select your third subject. Your papers, answer keys and analytics are generated for the combination you choose." },
      { q: "Is the 2-year package only for Class 11?", a: "Yes. Class 11 is the only program where a 24-month package is available, because it rolls straight into the Class 12 syllabus in year two without a fresh purchase." },
      { q: "How often are tests conducted?", a: "Class 11 runs roughly two CBT examinations per month, spaced to follow a standard school teaching calendar." },
    ],
    stats: [
      { label: "CBT tests / year", value: "24" },
      { label: "Question bank", value: "18,000+" },
      { label: "Avg. score lift", value: "+21%" },
    ],
  },
  {
    slug: "class-12",
    name: "Class 12 Accelerator",
    shortName: "Class 12",
    tagline: "Board precision and competitive speed, tested in the same paper.",
    description:
      "A single-year, high-intensity CBT programme for Class 12 students balancing board examinations with JEE/NEET preparation. Tests are sequenced against the board calendar with full-syllabus rehearsals in the final quarter.",
    audience: [
      "Class 12 Science students appearing for boards this session",
      "Students preparing simultaneously for JEE Main or NEET",
      "Students who need a disciplined weekly testing rhythm",
    ],
    subjects: [SUBJECTS.physics, SUBJECTS.chemistry, SUBJECTS.maths, SUBJECTS.biology],
    maxDurationMonths: 12,
    totalTests: 32,
    accent: "navy",
    icon: "Rocket",
    highlights: [
      "Board-blueprint and competitive-blueprint papers in one calendar",
      "Full-syllabus rehearsals in the last quarter",
      "Time-per-question analytics for exam-hall pacing",
      "Rank benchmarking against the whole Class 12 cohort",
    ],
    examPattern: schoolPattern,
    patternNotes: [
      "Duration: 180 minutes · Total 90 questions · 360 marks",
      "Class 12 programmes are offered as a maximum 1-year package",
      "Mathematics or Biology chosen at enrolment",
      "Final-quarter papers follow the exact national CBT interface",
    ],
    syllabus: [
      {
        subject: "Physics",
        units: [
          { title: "Electrodynamics", topics: ["Electrostatics", "Current Electricity", "Magnetic Effects", "EMI & AC"] },
          { title: "Optics", topics: ["Ray Optics", "Wave Optics"] },
          { title: "Modern Physics", topics: ["Dual Nature", "Atoms & Nuclei", "Semiconductors"] },
        ],
      },
      {
        subject: "Chemistry",
        units: [
          { title: "Physical Chemistry", topics: ["Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry"] },
          { title: "Inorganic Chemistry", topics: ["d & f Block", "Coordination Compounds", "p-Block (Group 15-18)"] },
          { title: "Organic Chemistry", topics: ["Haloalkanes", "Alcohols & Ethers", "Aldehydes & Ketones", "Amines", "Biomolecules", "Polymers"] },
        ],
      },
      {
        subject: "Mathematics",
        units: [
          { title: "Calculus", topics: ["Continuity & Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations"] },
          { title: "Algebra", topics: ["Matrices", "Determinants", "Relations & Functions"] },
          { title: "Vectors & 3D", topics: ["Vector Algebra", "Three Dimensional Geometry"] },
          { title: "Probability", topics: ["Conditional Probability", "Bayes Theorem", "Random Variables"] },
        ],
      },
      {
        subject: "Biology",
        units: [
          { title: "Reproduction", topics: ["Sexual Reproduction in Plants", "Human Reproduction", "Reproductive Health"] },
          { title: "Genetics & Evolution", topics: ["Inheritance", "Molecular Basis", "Evolution"] },
          { title: "Biology & Human Welfare", topics: ["Health & Disease", "Microbes", "Biotechnology", "Ecology"] },
        ],
      },
    ],
    faqs: [
      { q: "Why is Class 12 limited to a 1-year package?", a: "Class 12 is a single academic session. Nirvona intentionally caps this program at 12 months so students are never sold coverage past their board year." },
      { q: "Do the tests follow my school's teaching order?", a: "Yes. The calendar follows the standard CBSE/State teaching sequence, with the full syllabus opened in the final quarter." },
      { q: "Can I switch from Class 12 to JEE or NEET?", a: "You can hold both. Many students run Class 12 alongside a JEE or NEET package; results and analytics stay separate per program." },
    ],
    stats: [
      { label: "CBT tests / year", value: "32" },
      { label: "Full-syllabus mocks", value: "10" },
      { label: "Avg. accuracy lift", value: "+17%" },
    ],
  },
  {
    slug: "devoter",
    name: "Devoter Program",
    shortName: "Devoter",
    tagline: "Scripture, philosophy and reasoning — examined with modern rigour.",
    description:
      "Devoter is Nirvona's dedicated program for students of Indian scriptural studies, Sanskrit and classical philosophy. It brings a rigorous, computer-based examination structure to a discipline traditionally assessed informally.",
    audience: [
      "Students of Sanskrit, Vedic studies and Indian philosophy",
      "Gurukul and traditional institution students seeking formal assessment",
      "Candidates preparing for scriptural scholarship examinations",
    ],
    subjects: [SUBJECTS.sanskrit, SUBJECTS.philosophy, SUBJECTS.general],
    maxDurationMonths: 12,
    totalTests: 24,
    accent: "saffron",
    icon: "Flame",
    highlights: [
      "Structured assessment for a traditionally unassessed discipline",
      "Scripture comprehension, grammar and interpretation sections",
      "Reasoning and general aptitude for scholarship examinations",
      "Certificate-grade result reporting with percentile ranking",
    ],
    examPattern: [
      { section: "Sanskrit & Scriptures", questions: 40, marks: 160, type: "MCQ + Comprehension", negative: "-1" },
      { section: "Indian Philosophy", questions: 30, marks: 120, type: "MCQ + Assertion-Reason", negative: "-1" },
      { section: "General Aptitude", questions: 20, marks: 80, type: "Reasoning MCQ", negative: "-1" },
    ],
    patternNotes: [
      "Duration: 150 minutes · Total 90 questions · 360 marks",
      "Devoter is offered as a maximum 1-year package",
      "Devanagari-capable CBT interface with on-screen reference passages",
      "Papers are set by scholars in the respective traditions",
    ],
    syllabus: [
      {
        subject: "Sanskrit & Scriptures",
        units: [
          { title: "Vyakarana", topics: ["Sandhi", "Samasa", "Karaka", "Dhatu Roopa", "Shabda Roopa"] },
          { title: "Scriptural Texts", topics: ["Bhagavad Gita", "Upanishads (selected)", "Ramayana excerpts", "Subhashitani"] },
          { title: "Comprehension", topics: ["Gadya Anuvada", "Padya Vyakhya", "Contextual interpretation"] },
        ],
      },
      {
        subject: "Indian Philosophy",
        units: [
          { title: "Darshanas", topics: ["Nyaya", "Vaisheshika", "Samkhya", "Yoga", "Mimamsa", "Vedanta"] },
          { title: "Comparative Thought", topics: ["Buddhist schools", "Jain epistemology", "Bhakti traditions"] },
          { title: "Ethics", topics: ["Dharma", "Purusharthas", "Karma theory"] },
        ],
      },
      {
        subject: "General Aptitude",
        units: [
          { title: "Reasoning", topics: ["Analogy", "Series", "Logical deduction", "Data interpretation"] },
          { title: "Language", topics: ["Comprehension", "Vocabulary", "Précis"] },
        ],
      },
    ],
    faqs: [
      { q: "Is Devoter conducted in Sanskrit?", a: "Question papers are bilingual. Scriptural passages appear in Devanagari with the option of an English or Hindi interface for instructions." },
      { q: "Who sets the Devoter papers?", a: "Papers are set and reviewed by scholars from recognised institutions in each tradition, then validated through the same CBT quality process as our science programs." },
      { q: "What is the maximum package duration?", a: "Devoter is capped at a 1-year package." },
    ],
    stats: [
      { label: "CBT tests / year", value: "24" },
      { label: "Scriptural sources", value: "40+" },
      { label: "Scholar reviewers", value: "12" },
    ],
  },
  {
    slug: "jee",
    name: "JEE Advantage",
    shortName: "JEE",
    tagline: "Main and Advanced patterns, tested at national scale.",
    description:
      "Nirvona's JEE program replicates the National Testing Agency examination environment end to end — interface, timing, marking, normalisation and rank reporting — so the real exam day is never the first time you see it.",
    audience: [
      "JEE Main and Advanced aspirants in Class 11, 12 or repeating",
      "Students who need real rank benchmarking, not just scores",
      "Aspirants targeting a top-percentile score with limited time",
    ],
    subjects: [SUBJECTS.physics, SUBJECTS.chemistry, SUBJECTS.maths],
    maxDurationMonths: 24,
    totalTests: 60,
    accent: "ember",
    icon: "Atom",
    highlights: [
      "NTA-identical CBT interface, timer and marking scheme",
      "Main-pattern and Advanced-pattern papers in one calendar",
      "All-India rank and percentile against the live Nirvona cohort",
      "Chapter-level weakness detection with revision priority ordering",
    ],
    examPattern: jeePattern,
    patternNotes: [
      "Duration: 180 minutes · 90 questions · 360 marks (Nirvona blueprint)",
      "Marking mirrors JEE Main: +4 correct, -1 incorrect, 0 unattempted",
      "Main-pattern 75-question / 300-mark rehearsals run in the final quarter",
      "Advanced-pattern papers add multi-correct and matrix-match sets",
      "On-screen calculator, question palette and section switching enabled",
    ],
    syllabus: [
      {
        subject: "Physics",
        units: [
          { title: "Mechanics", topics: ["Kinematics", "Newton's Laws", "Work Power Energy", "Centre of Mass", "Rotation", "Gravitation", "SHM"] },
          { title: "Electrodynamics", topics: ["Electrostatics", "Capacitance", "Current Electricity", "Magnetism", "EMI", "AC Circuits"] },
          { title: "Optics & Modern", topics: ["Ray Optics", "Wave Optics", "Photoelectric Effect", "Atomic Models", "Nuclear Physics", "Semiconductors"] },
          { title: "Heat & Waves", topics: ["Thermodynamics", "Kinetic Theory", "Calorimetry", "Sound Waves"] },
        ],
      },
      {
        subject: "Chemistry",
        units: [
          { title: "Physical", topics: ["Mole Concept", "Atomic Structure", "Thermodynamics", "Equilibrium", "Electrochemistry", "Kinetics", "Solutions", "Solid State"] },
          { title: "Organic", topics: ["GOC", "Isomerism", "Hydrocarbons", "Halides", "Alcohols & Phenols", "Carbonyls", "Amines", "Biomolecules", "Polymers"] },
          { title: "Inorganic", topics: ["Periodicity", "Bonding", "s-Block", "p-Block", "d & f Block", "Coordination", "Metallurgy", "Qualitative Analysis"] },
        ],
      },
      {
        subject: "Mathematics",
        units: [
          { title: "Algebra", topics: ["Quadratic Equations", "Sequences", "Binomial", "Permutation & Combination", "Matrices", "Determinants", "Complex Numbers", "Probability"] },
          { title: "Calculus", topics: ["Functions", "Limits", "Continuity", "Differentiation", "AOD", "Indefinite Integration", "Definite Integration", "Area", "Differential Equations"] },
          { title: "Coordinate Geometry", topics: ["Straight Line", "Circle", "Parabola", "Ellipse", "Hyperbola", "3D Geometry", "Vectors"] },
          { title: "Trigonometry", topics: ["Ratios & Identities", "Equations", "Inverse Functions", "Heights & Distances"] },
        ],
      },
    ],
    faqs: [
      { q: "Are the papers Main pattern or Advanced pattern?", a: "Both. The calendar alternates Main-pattern papers with Advanced-pattern papers, and full-length Advanced rehearsals are scheduled closer to the exam window." },
      { q: "How is the rank calculated?", a: "Rank and percentile are computed across every Nirvona candidate who appeared for that CBT, using the same normalisation approach as national multi-shift examinations." },
      { q: "Is the 2-year package available?", a: "Yes — JEE supports up to a 24-month package for students starting in Class 11." },
    ],
    stats: [
      { label: "CBT tests", value: "60" },
      { label: "Advanced mocks", value: "18" },
      { label: "Avg. percentile gain", value: "+14.2" },
    ],
  },
  {
    slug: "neet",
    name: "NEET Advantage",
    shortName: "NEET",
    tagline: "720 marks. 200 minutes. Rehearsed until it is routine.",
    description:
      "A NEET-focused CBT program built around the three things that decide a medical seat: biology retention, chemistry accuracy and physics speed. Every paper is followed by topic-level diagnostics you can act on the same week.",
    audience: [
      "NEET aspirants in Class 11, Class 12 or repeating the attempt",
      "Students targeting a government medical college seat",
      "Aspirants needing accuracy discipline under negative marking",
    ],
    subjects: [SUBJECTS.physics, SUBJECTS.chemistry, SUBJECTS.biology],
    maxDurationMonths: 24,
    totalTests: 56,
    accent: "teal",
    icon: "Stethoscope",
    highlights: [
      "Full 180-question, 720-mark NEET blueprint",
      "NCERT line-level tagging on every Biology question",
      "Accuracy and negative-marking discipline analytics",
      "All-India rank projection against the Nirvona cohort",
    ],
    examPattern: neetPattern,
    patternNotes: [
      "Duration: 200 minutes · 180 questions · 720 marks",
      "+4 for a correct response, -1 for an incorrect response",
      "Biology carries 50% of the paper across Botany and Zoology",
      "Papers are tagged to NCERT chapters and line references",
    ],
    syllabus: [
      {
        subject: "Physics",
        units: [
          { title: "Mechanics", topics: ["Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation", "Properties of Solids & Liquids"] },
          { title: "Thermo & Waves", topics: ["Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"] },
          { title: "Electro & Modern", topics: ["Electrostatics", "Current Electricity", "Magnetism", "EMI & AC", "Optics", "Dual Nature", "Atoms & Nuclei", "Electronic Devices"] },
        ],
      },
      {
        subject: "Chemistry",
        units: [
          { title: "Physical", topics: ["Basic Concepts", "Structure of Atom", "Thermodynamics", "Equilibrium", "Redox", "Solutions", "Electrochemistry", "Kinetics"] },
          { title: "Inorganic", topics: ["Periodic Classification", "Chemical Bonding", "p-Block", "d & f Block", "Coordination Compounds"] },
          { title: "Organic", topics: ["Purification", "GOC", "Hydrocarbons", "Haloalkanes", "Alcohols Phenols Ethers", "Aldehydes Ketones Acids", "Amines", "Biomolecules"] },
        ],
      },
      {
        subject: "Biology",
        units: [
          { title: "Botany", topics: ["Diversity of Living Organisms", "Structural Organisation in Plants", "Cell Structure", "Plant Physiology", "Genetics", "Ecology"] },
          { title: "Zoology", topics: ["Animal Kingdom", "Structural Organisation in Animals", "Human Physiology", "Reproduction", "Evolution", "Human Health & Disease", "Biotechnology"] },
        ],
      },
    ],
    faqs: [
      { q: "Are questions strictly NCERT-based?", a: "Biology is tagged to NCERT chapters and line references. Physics and Chemistry follow the NEET syllabus with the difficulty distribution seen in recent papers." },
      { q: "How does Nirvona help with negative marking?", a: "Every result includes an accuracy and risk analysis showing where guessing cost you marks, and what your score would have been with disciplined attempts." },
      { q: "Do you offer a 2-year NEET package?", a: "Yes — NEET supports up to 24 months for students beginning in Class 11." },
    ],
    stats: [
      { label: "CBT tests", value: "56" },
      { label: "Biology questions", value: "12,000+" },
      { label: "Avg. score lift", value: "+68 marks" },
    ],
  },
];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((course) => course.slug === slug);
}

export const COURSE_MAP = Object.fromEntries(COURSES.map((c) => [c.slug, c])) as Record<
  Course["slug"],
  Course
>;
