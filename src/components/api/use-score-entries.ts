"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ScoreEntry, ScoreEntryType } from "@/lib/scoreboard";

interface DbScoreEntry {
  id: string;
  userId: string;
  type: string;
  date: string;
  reason: string | null;
  subject: string | null;
  teacher: string | null;
  createdAt: string;
}

function rowToEntry(row: DbScoreEntry): ScoreEntry {
  return {
    id: row.id,
    type: row.type as ScoreEntryType,
    date: row.date,
    reason: row.reason ?? undefined,
    subject: row.subject ?? undefined,
    teacher: row.teacher ?? undefined,
    createdAt: row.createdAt,
  };
}

const EMPTY: ScoreEntry[] = [];

export function useScoreEntries(): ScoreEntry[] {
  const { data } = useQuery<ScoreEntry[]>({
    queryKey: ["score-entries"],
    queryFn: async () => {
      const res = await fetch("/api/score-entries", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/score-entries ${res.status}`);
      const body = (await res.json()) as { scoreEntries: DbScoreEntry[] };
      return body.scoreEntries.map(rowToEntry);
    },
    placeholderData: EMPTY,
  });
  return data ?? EMPTY;
}

interface ScoreEntryBody {
  type: ScoreEntryType;
  date: string;
  reason?: string;
  subject?: string;
  teacher?: string;
}

function entryToBody(e: Omit<ScoreEntry, "id" | "createdAt">): ScoreEntryBody {
  return {
    type: e.type,
    date: e.date,
    reason: e.reason,
    subject: e.subject,
    teacher: e.teacher,
  };
}

export function useCreateScoreEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<ScoreEntry, "id" | "createdAt">) => {
      const res = await fetch("/api/score-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entryToBody(entry)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["score-entries"] }),
  });
}

export function useUpdateScoreEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: ScoreEntry) => {
      const res = await fetch(`/api/score-entries/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(entryToBody(entry)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["score-entries"] }),
  });
}

export function useDeleteScoreEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/score-entries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["score-entries"] }),
  });
}
