"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LESSON_COLORS } from "@/lib/timetable";
import {
  previewText,
  relativeTimeLabel,
  type Note,
} from "@/lib/notes";

export function NoteCard({ note }: { note: Note }) {
  const color = LESSON_COLORS[note.color ?? "neutral"];
  const preview = previewText(note.content);

  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex items-stretch overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex flex-1 flex-col gap-1 p-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="line-clamp-1 text-sm font-semibold leading-tight">
            {note.title || "Untitled note"}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {relativeTimeLabel(note.updatedAt)}
          </span>
        </div>
        {note.subject && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {note.subject}
          </span>
        )}
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {preview || <em className="opacity-60">empty</em>}
        </p>
      </div>
    </Link>
  );
}
