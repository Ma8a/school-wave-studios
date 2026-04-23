export type DayNum = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const DAYS: ReadonlyArray<{ num: DayNum; short: string; long: string }> = [
  { num: 1, short: "Mon", long: "Monday" },
  { num: 2, short: "Tue", long: "Tuesday" },
  { num: 3, short: "Wed", long: "Wednesday" },
  { num: 4, short: "Thu", long: "Thursday" },
  { num: 5, short: "Fri", long: "Friday" },
  { num: 6, short: "Sat", long: "Saturday" },
  { num: 7, short: "Sun", long: "Sunday" },
];

export const SCHOOL_DAYS: DayNum[] = [1, 2, 3, 4, 5];

/** JS Date.getDay(): Sun=0..Sat=6 → ISO day Mon=1..Sun=7. */
export function getCurrentDayNum(): DayNum {
  const js = new Date().getDay();
  return (js === 0 ? 7 : js) as DayNum;
}

export function dayLabel(day: DayNum, length: "short" | "long" = "long"): string {
  return DAYS.find((x) => x.num === day)?.[length] ?? "";
}

export function nowHHMM(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Returns `b - a` in minutes assuming HH:mm strings. Negative if b precedes a. */
export function minutesBetween(a: string, b: string): number {
  return toMinutes(b) - toMinutes(a);
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
