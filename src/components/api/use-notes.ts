"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Note } from "@/lib/notes";
import type { LessonColor } from "@/lib/timetable";

interface DbNote {
  id: string;
  userId: string;
  title: string;
  subject: string | null;
  content: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToNote(row: DbNote): Note {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject ?? undefined,
    content: row.content,
    color: (row.color as LessonColor | null) ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const EMPTY: Note[] = [];

/**
 * Full React Query result for the notes list. Use this when you need to
 * distinguish "still loading" from "loaded and empty" — e.g. on the detail
 * page, where an empty list should NOT render the NotFound view.
 */
export function useNotesQuery() {
  return useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/notes", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/notes ${res.status}`);
      const body = (await res.json()) as { notes: DbNote[] };
      return body.notes.map(rowToNote);
    },
    placeholderData: EMPTY,
  });
}

export function useNotes(): Note[] {
  return useNotesQuery().data ?? EMPTY;
}

/**
 * Single-note lookup — reads from the list query's cache. Triggers the list
 * fetch if not already in flight. This avoids a dedicated GET /api/notes/:id
 * endpoint at the cost of loading the whole list on direct deep-links.
 */
export function useNote(id: string): Note | undefined {
  const all = useNotes();
  return all.find((n) => n.id === id);
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

interface NoteBody {
  title: string;
  subject?: string;
  content: string;
  color?: LessonColor;
}

function noteToBody(n: Omit<Note, "id" | "createdAt" | "updatedAt">): NoteBody {
  return {
    title: n.title,
    subject: n.subject,
    content: n.content,
    color: n.color,
  };
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: Omit<Note, "id" | "createdAt" | "updatedAt">) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(noteToBody(n)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
      const body = (await res.json()) as { note: DbNote };
      return rowToNote(body.note);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: Note) => {
      const res = await fetch(`/api/notes/${n.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(noteToBody(n)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes"] }),
  });
}
