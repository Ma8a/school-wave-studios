"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarRange,
  GraduationCap,
  Map,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  useCreateEvent,
  useDeleteEvent,
  useUpdateEvent,
} from "@/components/api/use-events";
import { useLessons } from "@/components/api/use-lessons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EVENT_DEFAULT_COLOR,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  newCalendarEventId,
  todayISO,
  type CalendarEvent,
  type EventType,
} from "@/lib/calendar";
import {
  LESSON_COLOR_KEYS,
  LESSON_COLORS,
  type Lesson,
  type LessonColor,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export type CalendarEventDialogMode =
  | { kind: "create"; defaultType?: EventType }
  | { kind: "edit"; event: CalendarEvent };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: CalendarEventDialogMode;
}

const TYPE_ICON: Record<EventType, LucideIcon> = {
  test: GraduationCap,
  holiday: Sparkles,
  trip: Map,
  event: CalendarRange,
};

function emptyDraft(defaultType: EventType = "test"): CalendarEvent {
  const today = todayISO();
  return {
    id: newCalendarEventId(),
    type: defaultType,
    title: "",
    startDate: today,
    endDate: today,
    subject: "",
    description: "",
    color: EVENT_DEFAULT_COLOR[defaultType],
    createdAt: new Date().toISOString(),
  };
}

function uniqueSubjects(lessons: Lesson[]): string[] {
  const set = new Set<string>();
  for (const l of lessons) {
    const s = l.subject?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function CalendarEventDialog({ open, onOpenChange, mode }: Props) {
  const lessons = useLessons();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const busy =
    createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

  const [draft, setDraft] = useState<CalendarEvent>(() =>
    mode.kind === "edit" ? mode.event : emptyDraft(mode.defaultType),
  );

  const subjectSuggestions = useMemo(() => uniqueSubjects(lessons), [lessons]);

  function set<K extends keyof CalendarEvent>(k: K, v: CalendarEvent[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function changeType(t: EventType) {
    setDraft((d) => ({
      ...d,
      type: t,
      // Keep current color if user picked one explicitly; otherwise switch to
      // the type's default. We treat "matches old type's default" as "implicit".
      color:
        d.color === EVENT_DEFAULT_COLOR[d.type]
          ? EVENT_DEFAULT_COLOR[t]
          : d.color,
    }));
  }

  function changeStartDate(value: string) {
    setDraft((d) => {
      const next = { ...d, startDate: value };
      // If end is before new start, push end to match.
      if (value && d.endDate < value) next.endDate = value;
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || busy) return;
    if (draft.endDate < draft.startDate) return;
    const cleaned: CalendarEvent = {
      ...draft,
      title: draft.title.trim(),
      subject: draft.subject?.trim() || undefined,
      description: draft.description?.trim() || undefined,
    };
    if (mode.kind === "edit") {
      updateEvent.mutate(cleaned, { onSuccess: () => onOpenChange(false) });
    } else {
      const { id: _id, createdAt: _createdAt, ...payload } = cleaned;
      void _id;
      void _createdAt;
      createEvent.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit event" : "Add event"}
          </DialogTitle>
          <DialogDescription>
            Tests, holidays, trips, or anything you want to remember.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => {
                const selected = draft.type === t;
                const Icon = TYPE_ICON[t];
                const hex = LESSON_COLORS[EVENT_DEFAULT_COLOR[t]].hex;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => changeType(t)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-md border-2 px-2 py-2.5 text-xs font-medium transition-all",
                      selected
                        ? "scale-[1.02] border-current"
                        : "border-border opacity-70 hover:opacity-100",
                    )}
                    style={selected ? { color: hex } : undefined}
                  >
                    <span
                      aria-hidden
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${hex}26`, color: hex }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </span>
                    {EVENT_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-title">Title</Label>
            <Input
              id="ev-title"
              required
              maxLength={80}
              autoFocus={mode.kind === "create"}
              placeholder={
                draft.type === "test"
                  ? "e.g. Math test — chapters 4-5"
                  : draft.type === "holiday"
                    ? "e.g. Spring break"
                    : draft.type === "trip"
                      ? "e.g. School trip to museum"
                      : "e.g. Parent-teacher meeting"
              }
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-start">Starts</Label>
              <Input
                id="ev-start"
                type="date"
                required
                value={draft.startDate}
                onChange={(e) => changeStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-end">Ends</Label>
              <Input
                id="ev-end"
                type="date"
                required
                min={draft.startDate}
                value={draft.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-subject">Subject (optional)</Label>
              <Input
                id="ev-subject"
                maxLength={48}
                placeholder="e.g. Math"
                list="ev-subject-suggestions"
                value={draft.subject ?? ""}
                onChange={(e) => set("subject", e.target.value)}
              />
              <datalist id="ev-subject-suggestions">
                {subjectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {LESSON_COLOR_KEYS.map((c) => {
                  const selected = draft.color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("color", c as LessonColor)}
                      aria-label={LESSON_COLORS[c].label}
                      aria-pressed={selected}
                      className={cn(
                        "h-7 w-7 rounded-md ring-offset-background transition-transform",
                        selected
                          ? "scale-110 ring-2 ring-ring ring-offset-2"
                          : "hover:scale-105",
                      )}
                      style={{ backgroundColor: LESSON_COLORS[c].hex }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-description">Notes (optional)</Label>
            <textarea
              id="ev-description"
              rows={3}
              maxLength={500}
              placeholder="What to study, where to meet, what to bring…"
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {mode.kind === "edit" ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{draft.title || "Untitled event"}</strong> will be
                      permanently removed. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteEvent.mutate(draft.id, {
                          onSuccess: () => onOpenChange(false),
                        });
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!draft.title.trim() || busy}>
                {busy ? "Saving…" : mode.kind === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
