"use client";

import { BookOpen, MessageSquareText, Minus, Plus, User } from "lucide-react";
import {
  ENTRY_HEX,
  ENTRY_LABEL_SINGULAR,
  entryDateLabel,
  type ScoreEntry,
} from "@/lib/scoreboard";
import { cn } from "@/lib/utils";

interface ScoreEntryCardProps {
  entry: ScoreEntry;
  onEdit?: (entry: ScoreEntry) => void;
}

const ENTRY_ICON = {
  plus: Plus,
  minus: Minus,
  remark: MessageSquareText,
} as const;

export function ScoreEntryCard({ entry, onEdit }: ScoreEntryCardProps) {
  const Icon = ENTRY_ICON[entry.type];
  const hex = ENTRY_HEX[entry.type];

  const Wrapper = onEdit ? "button" : "div";
  const wrapperProps = onEdit
    ? {
        type: "button" as const,
        onClick: () => onEdit(entry),
        "aria-label": `Edit ${ENTRY_LABEL_SINGULAR[entry.type]} entry`,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group flex w-full items-stretch overflow-hidden rounded-lg border border-border bg-card text-left transition-colors",
        onEdit &&
          "cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span aria-hidden className="w-1.5 shrink-0" style={{ backgroundColor: hex }} />
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full ml-3"
        style={{ backgroundColor: `${hex}26`, color: hex }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="flex flex-1 flex-col gap-0.5 p-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold capitalize">
            {ENTRY_LABEL_SINGULAR[entry.type]}
          </span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {entryDateLabel(entry.date)}
          </span>
        </div>
        {entry.reason && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {entry.reason}
          </p>
        )}
        {(entry.subject || entry.teacher) && (
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {entry.subject && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {entry.subject}
              </span>
            )}
            {entry.teacher && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {entry.teacher}
              </span>
            )}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
