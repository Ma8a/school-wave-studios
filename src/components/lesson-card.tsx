"use client";

import { MapPin, Pencil, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LESSON_COLORS, type Lesson } from "@/lib/timetable";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: Lesson;
  active?: boolean;
  onEdit?: (l: Lesson) => void;
  className?: string;
}

export function LessonCard({ lesson, active = false, onEdit, className }: LessonCardProps) {
  const color = LESSON_COLORS[lesson.color ?? "neutral"];

  const Wrapper = onEdit ? "button" : "div";
  const wrapperProps = onEdit
    ? {
        type: "button" as const,
        onClick: () => onEdit(lesson),
        "aria-label": `Edit lesson ${lesson.subject}`,
      }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group relative flex w-full items-stretch overflow-hidden rounded-lg border border-border bg-card text-left transition-colors",
        onEdit && "cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "ring-2 ring-primary",
        className,
      )}
    >
      <span
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color.hex }}
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {lesson.startTime} – {lesson.endTime}
          </span>
          {active && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Now
            </span>
          )}
        </div>
        <div className="text-sm font-semibold leading-tight">{lesson.subject}</div>
        {(lesson.teacher || lesson.room) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {lesson.teacher && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" />
                {lesson.teacher}
              </span>
            )}
            {lesson.room && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Room {lesson.room}
              </span>
            )}
          </div>
        )}
      </div>
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          className="mr-1 self-center opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </Wrapper>
  );
}
