import type { CohortTestSchedule, ScheduleStream, ScheduleTier } from "@/types";
import raw from "./test-schedule.json";

export const TEST_SCHEDULES = raw as CohortTestSchedule[];

export function getCohortSchedule(id: string): CohortTestSchedule | undefined {
  return TEST_SCHEDULES.find((c) => c.id === id);
}

export const SCHEDULE_STREAMS: ScheduleStream[] = ["JEE", "NEET"];
export const SCHEDULE_TIERS: ScheduleTier[] = ["Basic", "Pro", "Pro Max"];

/** Every distinct "11th/12th/Dropper" label actually present for a stream, in a fixed teaching order. */
export function classLevelsForStream(stream: ScheduleStream): string[] {
  const order = ["11th", "12th", "Dropper"];
  const present = new Set(TEST_SCHEDULES.filter((c) => c.stream === stream).map((c) => c.classLevel));
  return order.filter((level) => present.has(level as CohortTestSchedule["classLevel"]));
}

export function schedulesFor(stream: ScheduleStream, classLevel: string): CohortTestSchedule[] {
  return TEST_SCHEDULES.filter((c) => c.stream === stream && c.classLevel === classLevel);
}

/** Next upcoming test (by real date, ignoring TBD entries) across a cohort's schedule. */
export function nextTest(schedule: CohortTestSchedule, today = new Date()) {
  const todayISO = today.toISOString().slice(0, 10);
  return schedule.tests
    .filter((t) => t.date && t.date >= todayISO)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))[0];
}
