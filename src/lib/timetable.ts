import type { DayNum } from "./time";

export type LessonColor =
  | "amber"
  | "ochre"
  | "rust"
  | "moss"
  | "dusty-blue"
  | "mauve"
  | "neutral";

/**
 * Muted hex values that complement the dark-warm palette.
 * Used as inline `backgroundColor` for the per-lesson color stripe so the
 * value can be data-driven without generating arbitrary Tailwind classes.
 */
export const LESSON_COLORS: Record<LessonColor, { label: string; hex: string }> = {
  amber: { label: "Mustard", hex: "#c79a3a" },
  ochre: { label: "Ochre", hex: "#a87a30" },
  rust: { label: "Rust", hex: "#b25c4a" },
  moss: { label: "Moss", hex: "#7d9966" },
  "dusty-blue": { label: "Dusty Blue", hex: "#5e7a99" },
  mauve: { label: "Mauve", hex: "#9a6c8a" },
  neutral: { label: "Neutral", hex: "#7a715f" },
};

export const LESSON_COLOR_KEYS: LessonColor[] = [
  "amber",
  "ochre",
  "rust",
  "moss",
  "dusty-blue",
  "mauve",
  "neutral",
];

/** Fortnight week: 1 = Week 1, 2 = Week 2. Schools with weekly rotation only use 1. */
export type WeekNum = 1 | 2;

export const WEEK_LABELS: Record<WeekNum, string> = {
  1: "Week 1",
  2: "Week 2",
};

export const WEEK_NUMS: WeekNum[] = [1, 2];

export interface Lesson {
  id: string;
  day: DayNum;
  week: WeekNum;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  subject: string;
  teacher?: string;
  room?: string;
  color?: LessonColor;
  notes?: string;
}

export interface UserProfile {
  name: string;
  createdAt: string; // ISO datetime
}

/**
 * Sample week shown on first visit so the app isn't empty.
 * The user replaces these with their real schedule.
 */
export const SEED_LESSONS: Lesson[] = [
  // Monday
  { id: "seed-mon-1", day: 1, week: 1, startTime: "08:00", endTime: "08:45", subject: "Math", teacher: "Ms. Wright", room: "12", color: "amber" },
  { id: "seed-mon-2", day: 1, week: 1, startTime: "08:55", endTime: "09:40", subject: "English", teacher: "Mr. Harris", room: "8", color: "rust" },
  { id: "seed-mon-3", day: 1, week: 1, startTime: "09:50", endTime: "10:35", subject: "Spanish", teacher: "Ms. Lopez", room: "21", color: "dusty-blue" },
  { id: "seed-mon-4", day: 1, week: 1, startTime: "10:45", endTime: "11:30", subject: "History", teacher: "Mr. Bennett", room: "5", color: "ochre" },
  { id: "seed-mon-5", day: 1, week: 1, startTime: "11:50", endTime: "12:35", subject: "PE", teacher: "Coach Lewis", room: "Gym", color: "moss" },
  // Tuesday
  { id: "seed-tue-1", day: 2, week: 1, startTime: "08:00", endTime: "08:45", subject: "Biology", teacher: "Ms. Green", room: "14", color: "moss" },
  { id: "seed-tue-2", day: 2, week: 1, startTime: "08:55", endTime: "09:40", subject: "Chemistry", teacher: "Mr. Patel", room: "15", color: "mauve" },
  { id: "seed-tue-3", day: 2, week: 1, startTime: "09:50", endTime: "10:35", subject: "Math", teacher: "Ms. Wright", room: "12", color: "amber" },
  { id: "seed-tue-4", day: 2, week: 1, startTime: "10:45", endTime: "11:30", subject: "English", teacher: "Mr. Harris", room: "8", color: "rust" },
  // Wednesday
  { id: "seed-wed-1", day: 3, week: 1, startTime: "08:00", endTime: "08:45", subject: "Geography", teacher: "Ms. Adams", room: "9", color: "dusty-blue" },
  { id: "seed-wed-2", day: 3, week: 1, startTime: "08:55", endTime: "09:40", subject: "Spanish", teacher: "Ms. Lopez", room: "21", color: "dusty-blue" },
  { id: "seed-wed-3", day: 3, week: 1, startTime: "09:50", endTime: "10:35", subject: "Art", teacher: "Mr. Cole", room: "Studio", color: "mauve" },
  { id: "seed-wed-4", day: 3, week: 1, startTime: "10:45", endTime: "11:30", subject: "Math", teacher: "Ms. Wright", room: "12", color: "amber" },
  // Thursday
  { id: "seed-thu-1", day: 4, week: 1, startTime: "08:00", endTime: "08:45", subject: "Physics", teacher: "Mr. Baker", room: "16", color: "ochre" },
  { id: "seed-thu-2", day: 4, week: 1, startTime: "08:55", endTime: "09:40", subject: "English", teacher: "Mr. Harris", room: "8", color: "rust" },
  { id: "seed-thu-3", day: 4, week: 1, startTime: "09:50", endTime: "10:35", subject: "History", teacher: "Mr. Bennett", room: "5", color: "ochre" },
  { id: "seed-thu-4", day: 4, week: 1, startTime: "10:45", endTime: "11:30", subject: "Computing", teacher: "Mr. Park", room: "Lab", color: "neutral" },
  { id: "seed-thu-5", day: 4, week: 1, startTime: "11:50", endTime: "12:35", subject: "PE", teacher: "Coach Lewis", room: "Gym", color: "moss" },
  // Friday
  { id: "seed-fri-1", day: 5, week: 1, startTime: "08:00", endTime: "08:45", subject: "Religious Studies", teacher: "Mr. Thomas", room: "11", color: "neutral" },
  { id: "seed-fri-2", day: 5, week: 1, startTime: "08:55", endTime: "09:40", subject: "Math", teacher: "Ms. Wright", room: "12", color: "amber" },
  { id: "seed-fri-3", day: 5, week: 1, startTime: "09:50", endTime: "10:35", subject: "Spanish", teacher: "Ms. Lopez", room: "21", color: "dusty-blue" },
  { id: "seed-fri-4", day: 5, week: 1, startTime: "10:45", endTime: "11:30", subject: "Music", teacher: "Ms. Reed", room: "20", color: "mauve" },
];

export function newLessonId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function lessonsByDay(lessons: Lesson[], day: DayNum): Lesson[] {
  return lessons
    .filter((l) => l.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function isValidLesson(l: unknown): l is Lesson {
  if (!l || typeof l !== "object") return false;
  const x = l as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.day === "number" &&
    (x.week === 1 || x.week === 2 || x.week === undefined) && // undefined tolerated for legacy data
    typeof x.startTime === "string" &&
    typeof x.endTime === "string" &&
    typeof x.subject === "string"
  );
}

/** Filter lessons for a given week (A or B). Used by timetable grid + today view. */
export function lessonsInWeek(lessons: Lesson[], week: WeekNum): Lesson[] {
  return lessons.filter((l) => (l.week ?? 1) === week);
}
