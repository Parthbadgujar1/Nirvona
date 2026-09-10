import type {
  AnswerKey,
  AnswerKeyEntry,
  PerformanceAnalysis,
  Result,
  StudentResponse,
  StudentResponseRow,
  SubjectResult,
} from "@/types";
import { seeded } from "@/lib/utils";
import { CURRENT_STUDENT, STUDENTS } from "./students";

const OPTIONS = ["A", "B", "C", "D"] as const;

const TOPIC_BANK: Record<string, string[]> = {
  Physics: [
    "Kinematics", "Laws of Motion", "Work Energy & Power", "Rotational Motion",
    "Gravitation", "Thermodynamics", "SHM & Waves", "Electrostatics",
    "Current Electricity", "Magnetism", "EMI & AC", "Ray Optics",
    "Wave Optics", "Modern Physics", "Semiconductors",
  ],
  Chemistry: [
    "Mole Concept", "Atomic Structure", "Chemical Bonding", "Thermodynamics",
    "Equilibrium", "Electrochemistry", "Chemical Kinetics", "Solutions",
    "p-Block Elements", "d & f Block", "Coordination Compounds",
    "General Organic Chemistry", "Hydrocarbons", "Aldehydes & Ketones",
    "Organic Chemistry — Named Reactions", "Biomolecules",
  ],
  Mathematics: [
    "Quadratic Equations", "Sequences & Series", "Binomial Theorem",
    "Permutations & Combinations", "Matrices & Determinants", "Complex Numbers",
    "Straight Lines", "Circles", "Conic Sections", "Limits & Continuity",
    "Differentiation", "Application of Derivatives", "Integration",
    "Differential Equations", "Vectors & 3D", "Probability", "Trigonometry",
  ],
};

const SUBJECT_COLOR: Record<string, string> = {
  Physics: "#2563eb",
  Chemistry: "#f95c14",
  Mathematics: "#0e1d4a",
};

const SUBJECT_ORDER = ["Physics", "Chemistry", "Mathematics"] as const;

interface SubjectSplit {
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  timeSpentMin: number;
  percentile: number;
}

interface ExamBlueprint {
  examId: string;
  examName: string;
  date: string;
  rank: number;
  totalCandidates: number;
  percentile: number;
  timeTakenMin: number;
  topPerformerScore: number;
  averageScore: number;
  splits: Record<string, SubjectSplit>;
}

const BLUEPRINTS: ExamBlueprint[] = [
  {
    examId: "CBT-01",
    examName: "CBT-01 · Foundation Diagnostic",
    date: "2026-06-14",
    rank: 412,
    totalCandidates: 1148,
    percentile: 88.4,
    timeTakenMin: 176,
    topPerformerScore: 331,
    averageScore: 183,
    splits: {
      Physics: { correct: 19, incorrect: 4, unattempted: 7, score: 72, timeSpentMin: 64, percentile: 84.2 },
      Chemistry: { correct: 23, incorrect: 4, unattempted: 3, score: 88, timeSpentMin: 48, percentile: 90.6 },
      Mathematics: { correct: 19, incorrect: 5, unattempted: 6, score: 71, timeSpentMin: 64, percentile: 83.1 },
    },
  },
  {
    examId: "CBT-02",
    examName: "CBT-02 · Mid-Term Assessment",
    date: "2026-07-12",
    rank: 289,
    totalCandidates: 1203,
    percentile: 92.1,
    timeTakenMin: 179,
    topPerformerScore: 342,
    averageScore: 191,
    splits: {
      Physics: { correct: 22, incorrect: 3, unattempted: 5, score: 85, timeSpentMin: 61, percentile: 89.4 },
      Chemistry: { correct: 25, incorrect: 3, unattempted: 2, score: 97, timeSpentMin: 46, percentile: 93.8 },
      Mathematics: { correct: 20, incorrect: 6, unattempted: 4, score: 74, timeSpentMin: 72, percentile: 85.0 },
    },
  },
  {
    examId: "CBT-03",
    examName: "CBT-03 · Cumulative Review",
    date: "2026-08-16",
    rank: 127,
    totalCandidates: 1256,
    percentile: 96.8,
    timeTakenMin: 180,
    topPerformerScore: 348,
    averageScore: 198,
    splits: {
      Physics: { correct: 25, incorrect: 2, unattempted: 3, score: 98, timeSpentMin: 58, percentile: 94.1 },
      Chemistry: { correct: 28, incorrect: 2, unattempted: 0, score: 110, timeSpentMin: 44, percentile: 97.9 },
      Mathematics: { correct: 21, incorrect: 5, unattempted: 4, score: 79, timeSpentMin: 78, percentile: 88.6 },
    },
  },
];

function buildSubjects(bp: ExamBlueprint): SubjectResult[] {
  return SUBJECT_ORDER.map((subject) => {
    const s = bp.splits[subject];
    const attempted = s.correct + s.incorrect;
    return {
      subject,
      color: SUBJECT_COLOR[subject],
      score: s.score,
      maxScore: 120,
      correct: s.correct,
      incorrect: s.incorrect,
      unattempted: s.unattempted,
      accuracy: attempted ? Number(((s.correct / attempted) * 100).toFixed(1)) : 0,
      timeSpentMin: s.timeSpentMin,
      percentile: s.percentile,
    };
  });
}

function buildResult(bp: ExamBlueprint): Result {
  const subjects = buildSubjects(bp);
  const score = subjects.reduce((sum, s) => sum + s.score, 0);
  const correct = subjects.reduce((sum, s) => sum + s.correct, 0);
  const incorrect = subjects.reduce((sum, s) => sum + s.incorrect, 0);
  const unattempted = subjects.reduce((sum, s) => sum + s.unattempted, 0);
  const attempted = correct + incorrect;
  return {
    id: `RES-${bp.examId}-${CURRENT_STUDENT.id}`,
    examId: bp.examId,
    examName: bp.examName,
    studentId: CURRENT_STUDENT.id,
    studentName: CURRENT_STUDENT.fullName,
    courseSlug: "jee",
    date: bp.date,
    score,
    maxScore: 360,
    percentage: Number(((score / 360) * 100).toFixed(2)),
    rank: bp.rank,
    totalCandidates: bp.totalCandidates,
    percentile: bp.percentile,
    accuracy: Number(((correct / attempted) * 100).toFixed(1)),
    correct,
    incorrect,
    unattempted,
    timeTakenMin: bp.timeTakenMin,
    subjects,
    status: "published",
    topPerformerScore: bp.topPerformerScore,
    averageScore: bp.averageScore,
  };
}

/** Results for the signed-in demo student, newest first. */
export const STUDENT_RESULTS: Result[] = BLUEPRINTS.map(buildResult).reverse();

export const LATEST_RESULT = STUDENT_RESULTS[0];

export function getResult(id: string) {
  return STUDENT_RESULTS.find((r) => r.id === id || r.examId === id);
}

/* --------------------------- Per-question data ----------------------- */

function buildRows(bp: ExamBlueprint): StudentResponseRow[] {
  const rng = seeded(bp.examId.length * 977 + bp.rank);
  const rows: StudentResponseRow[] = [];
  let qNo = 1;

  for (const subject of SUBJECT_ORDER) {
    const split = bp.splits[subject];
    const topics = TOPIC_BANK[subject];
    const pattern: StudentResponseRow["status"][] = [
      ...Array<StudentResponseRow["status"]>(split.correct).fill("correct"),
      ...Array<StudentResponseRow["status"]>(split.incorrect).fill("incorrect"),
      ...Array<StudentResponseRow["status"]>(split.unattempted).fill("unattempted"),
    ];
    // Deterministic shuffle so statuses are spread through the section.
    for (let i = pattern.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [pattern[i], pattern[j]] = [pattern[j], pattern[i]];
    }

    pattern.forEach((status, index) => {
      const correctOption = OPTIONS[Math.floor(rng() * 4)];
      let markedOption: StudentResponseRow["markedOption"] = null;
      if (status === "correct") markedOption = correctOption;
      if (status === "incorrect") {
        const wrong = OPTIONS.filter((o) => o !== correctOption);
        markedOption = wrong[Math.floor(rng() * 3)];
      }
      rows.push({
        qNo: qNo + index,
        subject,
        topic: topics[Math.floor(rng() * topics.length)],
        markedOption,
        correctOption,
        status,
        timeSpentSec:
          status === "unattempted"
            ? Math.round(8 + rng() * 25)
            : Math.round(45 + rng() * 165),
        marks: status === "correct" ? 4 : status === "incorrect" ? -1 : 0,
      });
    });
    qNo += pattern.length;
  }
  return rows;
}

export const STUDENT_RESPONSES: Record<string, StudentResponse> = Object.fromEntries(
  BLUEPRINTS.map((bp) => [
    bp.examId,
    {
      examId: bp.examId,
      studentId: CURRENT_STUDENT.id,
      uploadedAt: `${bp.date}T18:30:00Z`,
      validation: "valid",
      processing: "evaluated",
      rows: buildRows(bp),
    } satisfies StudentResponse,
  ]),
);

export const ANSWER_KEYS: Record<string, AnswerKey> = Object.fromEntries(
  BLUEPRINTS.map((bp) => {
    const rows = STUDENT_RESPONSES[bp.examId].rows;
    const entries: AnswerKeyEntry[] = rows.map((row) => ({
      qNo: row.qNo,
      subject: row.subject,
      topic: row.topic,
      correctOption: row.correctOption,
      marks: 4,
      negative: 1,
    }));
    return [
      bp.examId,
      {
        examId: bp.examId,
        uploadedAt: `${bp.date}T20:00:00Z`,
        publishedAt: `${bp.date}T21:00:00Z`,
        totalQuestions: 90,
        status: "published",
        entries,
      } satisfies AnswerKey,
    ];
  }),
);

/* -------------------------- Performance analysis --------------------- */

const TOPIC_PERFORMANCE = [
  { topic: "Organic Chemistry", subject: "Chemistry", accuracy: 94, attempted: 34, total: 36, trend: 6 },
  { topic: "Mechanics", subject: "Physics", accuracy: 91, attempted: 32, total: 33, trend: 9 },
  { topic: "Algebra", subject: "Mathematics", accuracy: 88, attempted: 26, total: 28, trend: 4 },
  { topic: "Coordination Compounds", subject: "Chemistry", accuracy: 86, attempted: 14, total: 15, trend: 3 },
  { topic: "Modern Physics", subject: "Physics", accuracy: 84, attempted: 18, total: 20, trend: 7 },
  { topic: "Trigonometry", subject: "Mathematics", accuracy: 79, attempted: 19, total: 22, trend: 2 },
  { topic: "Thermodynamics", subject: "Chemistry", accuracy: 74, attempted: 17, total: 21, trend: -1 },
  { topic: "Ray Optics", subject: "Physics", accuracy: 68, attempted: 13, total: 18, trend: 1 },
  { topic: "Physical Chemistry — Equilibrium", subject: "Chemistry", accuracy: 61, attempted: 11, total: 18, trend: -4 },
  { topic: "Electrostatics", subject: "Physics", accuracy: 56, attempted: 12, total: 21, trend: -6 },
  { topic: "Calculus", subject: "Mathematics", accuracy: 52, attempted: 15, total: 29, trend: -3 },
  { topic: "Probability", subject: "Mathematics", accuracy: 48, attempted: 8, total: 17, trend: -8 },
];

export const PERFORMANCE: PerformanceAnalysis = {
  studentId: CURRENT_STUDENT.id,
  scoreTrend: BLUEPRINTS.map((bp) => {
    const result = buildResult(bp);
    return {
      exam: bp.examId,
      score: result.score,
      average: bp.averageScore,
      topper: bp.topPerformerScore,
    };
  }),
  rankTrend: BLUEPRINTS.map((bp) => ({
    exam: bp.examId,
    rank: bp.rank,
    percentile: bp.percentile,
  })),
  accuracyTrend: BLUEPRINTS.map((bp) => {
    const result = buildResult(bp);
    return { exam: bp.examId, accuracy: result.accuracy };
  }),
  subjectComparison: [
    { subject: "Physics", you: 82, average: 54, topper: 96 },
    { subject: "Chemistry", you: 92, average: 61, topper: 98 },
    { subject: "Mathematics", you: 66, average: 49, topper: 94 },
  ],
  topics: TOPIC_PERFORMANCE,
  strengths: ["Organic Chemistry", "Mechanics", "Algebra"],
  weaknesses: ["Calculus", "Electrostatics", "Physical Chemistry"],
  improvements: ["Probability", "Ray Optics", "Thermodynamics"],
  timeDistribution: [
    { subject: "Physics", minutes: 58, color: "#2563eb" },
    { subject: "Chemistry", minutes: 44, color: "#f95c14" },
    { subject: "Mathematics", minutes: 78, color: "#0e1d4a" },
  ],
  summary:
    "Your score improved by 12% compared to your previous test. Chemistry is now your strongest section — the biggest available gain is in Mathematics, where 4 unattempted questions cost you an estimated 16 marks.",
  improvementPercent: 12.1,
};

/* ------------------------- Cohort results (admin) -------------------- */

export const COHORT_RESULTS: Result[] = (() => {
  const rng = seeded(4231);
  return STUDENTS.slice(0, 20).map((student, index) => {
    const score = index === 0 ? 287 : Math.round(120 + rng() * 210);
    const rank = index === 0 ? 127 : Math.round(1 + rng() * 1255);
    const correct = Math.round(score / 4 + 2);
    const incorrect = Math.round(4 + rng() * 14);
    const unattempted = Math.max(0, 90 - correct - incorrect);
    return {
      id: `RES-CBT-03-${student.id}`,
      examId: "CBT-03",
      examName: "CBT-03 · Cumulative Review",
      studentId: student.id,
      studentName: student.fullName,
      courseSlug: student.examPreference[0],
      date: "2026-08-16",
      score,
      maxScore: 360,
      percentage: Number(((score / 360) * 100).toFixed(2)),
      rank,
      totalCandidates: 1256,
      percentile: Number((100 - (rank / 1256) * 100).toFixed(1)),
      accuracy: Number(((correct / Math.max(1, correct + incorrect)) * 100).toFixed(1)),
      correct,
      incorrect,
      unattempted,
      timeTakenMin: Math.round(150 + rng() * 30),
      subjects: [],
      status: index % 9 === 4 ? "processing" : "published",
      topPerformerScore: 348,
      averageScore: 198,
    } satisfies Result;
  });
})();

export const SCORE_DISTRIBUTION = [
  { band: "0–60", students: 38 },
  { band: "61–120", students: 142 },
  { band: "121–180", students: 318 },
  { band: "181–240", students: 402 },
  { band: "241–300", students: 274 },
  { band: "301–360", students: 82 },
];

export const CENTRE_PERFORMANCE = [
  { centre: "Jaipur", average: 214, candidates: 462, topScore: 348 },
  { centre: "New Delhi", average: 226, candidates: 588, topScore: 344 },
  { centre: "Pune", average: 205, candidates: 372, topScore: 330 },
  { centre: "Hyderabad", average: 219, candidates: 511, topScore: 341 },
  { centre: "Kochi", average: 198, candidates: 296, topScore: 322 },
];
