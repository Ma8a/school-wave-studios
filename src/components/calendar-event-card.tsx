"use client";

import {
  BookOpen,
  CalendarRange,
  GraduationCap,
  Map,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { LESSON_COLORS } from "@/lib/timetable";
import {
  EVENT_DEFAULT_COLOR,
  EVENT_TYPE_LABELS,
  formatEventDateRange,
  relativeEventLabel,
  type CalendarEvent,
  type EventType,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<EventType, LucideIcon> = {
  test: GraduationCap,
  holiday: Sparkles,
  trip: Map,
  event: CalendarRange,
};

interface CalendarEventCardProps {
  event: CalendarEvent;
  onEdit?: (e: CalendarEvent) => void;
}

export function CalendarEventCard({ event, onEdit }: CalendarEventCardProps) {
  const Icon = TYPE_ICON[event.type];
  const colorKey = event.color ?? EVENT_DEFAULT_COLOR[event.type];
  const hex = LESSON_COLORS[colorKey].hex;
  const dateRange = formatEventDateRange(event.startDate, event.endDate);
  const relative = relativeEventLabel(event);

  const Wrapper = onEdit ? "button" : "div";
  const wrapperProps = onEdit
    ? {
        type: "button" as const,
        onClick: () => onEdit(event),
        "aria-label": `Edit ${event.title}`,
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
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="flex flex-1 flex-col gap-0.5 p-3 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold leading-tight">{event.title}</span>
          <span className="shrink-0 text-[11px] font-mono tabular-nums text-muted-foreground">
            {dateRange}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="capitalize">{EVENT_TYPE_LABELS[event.type].toLowerCase()}</span>
          <span aria-hidden>·</span>
          <span>{relative}</span>
          {event.subject && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {event.subject}
              </span>
            </>
          )}
        </div>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>
    </Wrapper>
  );
}
