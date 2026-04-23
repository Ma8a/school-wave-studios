"use client";

import { Check, BookOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleHomeworkDone } from "@/components/api/use-homework";
import {
  classifyHomework,
  relativeDueLabel,
  type Homework,
} from "@/lib/homework";
import { LESSON_COLORS } from "@/lib/timetable";
import { cn } from "@/lib/utils";

interface HomeworkCardProps {
  homework: Homework;
  onEdit?: (h: Homework) => void;
  className?: string;
}

export function HomeworkCard({ homework, onEdit, className }: HomeworkCardProps) {
  const toggle = useToggleHomeworkDone();
  const color = LESSON_COLORS[homework.color ?? "neutral"];
  const bucket = classifyHomework(homework);
  const due = relativeDueLabel(homework.dueDate);

  return (
    <div
      className={cn(
        "group relative flex items-stretch overflow-hidden rounded-lg border border-border bg-card transition-colors",
        bucket === "overdue" && !homework.done && "border-destructive/50",
        homework.done && "opacity-60",
        className,
      )}
    >
      <span
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: color.hex }}
      />

      <button
        type="button"
        onClick={() => toggle.mutate(homework.id)}
        aria-label={homework.done ? "Mark as not done" : "Mark as done"}
        aria-pressed={homework.done}
        className={cn(
          "my-3 ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          homework.done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary",
        )}
      >
        {homework.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <button
        type="button"
        onClick={onEdit ? () => onEdit(homework) : undefined}
        disabled={!onEdit}
        aria-label={onEdit ? `Edit homework ${homework.title}` : undefined}
        className={cn(
          "flex flex-1 flex-col gap-1 p-3 text-left",
          onEdit &&
            "cursor-pointer transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-sm font-semibold leading-tight",
              homework.done && "line-through",
            )}
          >
            {homework.title}
          </span>
          <span
            className={cn(
              "shrink-0 font-mono text-[11px] tabular-nums",
              bucket === "overdue" && !homework.done
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {homework.done ? "done" : due}
          </span>
        </div>
        {(homework.subject || homework.description) && (
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {homework.subject && (
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {homework.subject}
              </span>
            )}
            {homework.description && (
              <p className="line-clamp-2">{homework.description}</p>
            )}
          </div>
        )}
      </button>

      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          className="mr-1 self-center opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden
          onClick={() => onEdit(homework)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
