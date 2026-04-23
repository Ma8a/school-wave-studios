"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { DayNum } from "@/lib/time";
import type { Lesson, LessonColor, WeekNum } from "@/lib/timetable";

/** Drizzle's row shape (snake_case-free thanks to schema field aliases). */
interface DbLesson {
  id: string;
  userId: string;
  day: number;
  week: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string | null;
  room: string | null;
  color: string | null;
  notes: string | null;
}

function rowToLesson(row: DbLesson): Lesson {
  return {
    id: row.id,
    day: row.day as DayNum,
    week: (row.week === 2 ? 2 : 1) as WeekNum,
    startTime: row.startTime,
    endTime: row.endTime,
    subject: row.subject,
    teacher: row.teacher ?? undefined,
    room: row.room ?? undefined,
    color: (row.color as LessonColor | null) ?? undefined,
    notes: row.notes ?? undefined,
  };
}

const EMPTY: Lesson[] = [];

/**
 * Subscribe to the current user's lessons. Returns `[]` while loading or
 * unauthenticated so consumers don't have to thread loading state through
 * the entire timetable UI.
 */
export function useLessons(): Lesson[] {
  const { data } = useQuery<Lesson[]>({
    queryKey: ["lessons"],
    queryFn: async () => {
      const res = await fetch("/api/lessons", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/lessons ${res.status}`);
      const body = (await res.json()) as { lessons: DbLesson[] };
      return body.lessons.map(rowToLesson);
    },
    placeholderData: EMPTY,
  });
  return data ?? EMPTY;
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

interface LessonInput {
  day: DayNum;
  week: WeekNum;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
  color?: LessonColor;
  notes?: string;
}

function lessonToBody(l: Omit<Lesson, "id">): LessonInput {
  return {
    day: l.day,
    week: l.week,
    startTime: l.startTime,
    endTime: l.endTime,
    subject: l.subject,
    teacher: l.teacher,
    room: l.room,
    color: l.color,
    notes: l.notes,
  };
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: Omit<Lesson, "id">) => {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(lessonToBody(lesson)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: Lesson) => {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(lessonToBody(lesson)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lessons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}
