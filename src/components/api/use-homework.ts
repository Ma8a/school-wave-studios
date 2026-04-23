"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Homework } from "@/lib/homework";
import type { LessonColor } from "@/lib/timetable";

/** DB row shape (SQLite stores `done` as 0/1 but Drizzle converts to boolean). */
interface DbHomework {
  id: string;
  userId: string;
  title: string;
  subject: string | null;
  dueDate: string;
  description: string | null;
  done: boolean;
  doneAt: string | null;
  createdAt: string;
  color: string | null;
}

function rowToHomework(row: DbHomework): Homework {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject ?? undefined,
    dueDate: row.dueDate,
    description: row.description ?? undefined,
    done: row.done,
    doneAt: row.doneAt ?? undefined,
    createdAt: row.createdAt,
    color: (row.color as LessonColor | null) ?? undefined,
  };
}

const EMPTY: Homework[] = [];

export function useHomework(): Homework[] {
  const { data } = useQuery<Homework[]>({
    queryKey: ["homework"],
    queryFn: async () => {
      const res = await fetch("/api/homework", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/homework ${res.status}`);
      const body = (await res.json()) as { homework: DbHomework[] };
      return body.homework.map(rowToHomework);
    },
    placeholderData: EMPTY,
  });
  return data ?? EMPTY;
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

interface HomeworkBody {
  title: string;
  subject?: string;
  dueDate: string;
  description?: string;
  done: boolean;
  doneAt?: string;
  color?: LessonColor;
}

function homeworkToBody(h: Omit<Homework, "id" | "createdAt">): HomeworkBody {
  return {
    title: h.title,
    subject: h.subject,
    dueDate: h.dueDate,
    description: h.description,
    done: h.done,
    doneAt: h.doneAt,
    color: h.color,
  };
}

export function useCreateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hw: Omit<Homework, "id" | "createdAt">) => {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(homeworkToBody(hw)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
  });
}

export function useUpdateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hw: Homework) => {
      const res = await fetch(`/api/homework/${hw.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(homeworkToBody(hw)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
  });
}

export function useDeleteHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/homework/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homework"] }),
  });
}

/**
 * Optimistic toggle: flips `done` in the cache immediately so the UI feels
 * instant, then syncs with the server. If the request fails, we roll back
 * the cache to whatever it was before the click.
 *
 * This is the ONE mutation where we do optimistic updates — a tap on the
 * done-circle is a fire-and-forget gesture where even a small latency
 * feels broken. All the dialog-based mutations (create/update/delete)
 * stay pessimistic because the dialog already provides a natural "saving"
 * moment.
 */
export function useToggleHomeworkDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const all = qc.getQueryData<Homework[]>(["homework"]) ?? [];
      const hw = all.find((h) => h.id === id);
      if (!hw) throw new Error("Homework not found");
      const flipped: Homework = {
        ...hw,
        done: !hw.done,
        doneAt: !hw.done ? new Date().toISOString() : undefined,
      };
      const res = await fetch(`/api/homework/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(homeworkToBody(flipped)),
      });
      if (!res.ok) throw new Error(`Toggle failed (${res.status})`);
    },
    onMutate: async (id) => {
      // Prevent in-flight list fetches from overwriting our optimistic update.
      await qc.cancelQueries({ queryKey: ["homework"] });
      const prev = qc.getQueryData<Homework[]>(["homework"]);
      if (prev) {
        qc.setQueryData<Homework[]>(
          ["homework"],
          prev.map((h) =>
            h.id === id
              ? {
                  ...h,
                  done: !h.done,
                  doneAt: !h.done ? new Date().toISOString() : undefined,
                }
              : h,
          ),
        );
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      // Roll back.
      if (ctx?.prev) qc.setQueryData(["homework"], ctx.prev);
    },
    onSettled: () => {
      // Resync from server regardless of success/failure.
      qc.invalidateQueries({ queryKey: ["homework"] });
    },
  });
}
