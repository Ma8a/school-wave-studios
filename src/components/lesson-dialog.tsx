"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateLesson,
  useDeleteLesson,
  useUpdateLesson,
} from "@/components/api/use-lessons";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAYS, SCHOOL_DAYS, type DayNum } from "@/lib/time";
import {
  LESSON_COLOR_KEYS,
  LESSON_COLORS,
  newLessonId,
  WEEK_LABELS,
  WEEK_NUMS,
  type Lesson,
  type LessonColor,
  type WeekNum,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export type LessonDialogMode =
  | { kind: "create"; defaultDay?: DayNum; defaultWeek?: WeekNum }
  | { kind: "edit"; lesson: Lesson };

interface LessonDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: LessonDialogMode;
}

function emptyDraft(defaultDay: DayNum = 1, defaultWeek: WeekNum = 1): Lesson {
  return {
    id: newLessonId(),
    day: defaultDay,
    week: defaultWeek,
    startTime: "08:00",
    endTime: "08:45",
    subject: "",
    teacher: "",
    room: "",
    color: "amber",
  };
}

export function LessonDialog({ open, onOpenChange, mode }: LessonDialogProps) {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  // Parent must remount this component (via `key`) when `mode` changes so
  // the initial draft reflects the new mode — that keeps state derivation
  // entirely in the constructor and avoids set-state-in-effect.
  const [draft, setDraft] = useState<Lesson>(() =>
    mode.kind === "edit"
      ? mode.lesson
      : emptyDraft(mode.defaultDay, mode.defaultWeek),
  );

  const busy =
    createLesson.isPending ||
    updateLesson.isPending ||
    deleteLesson.isPending;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.subject.trim() || busy) return;
    const cleaned: Lesson = {
      ...draft,
      subject: draft.subject.trim(),
      teacher: draft.teacher?.trim() || undefined,
      room: draft.room?.trim() || undefined,
    };
    if (mode.kind === "edit") {
      updateLesson.mutate(cleaned, { onSuccess: () => onOpenChange(false) });
    } else {
      // Server assigns the canonical id; throw away the client-generated one.
      const { id: _ignore, ...withoutId } = cleaned;
      void _ignore;
      createLesson.mutate(withoutId, { onSuccess: () => onOpenChange(false) });
    }
  }

  function set<K extends keyof Lesson>(k: K, v: Lesson[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit lesson" : "Add lesson"}
          </DialogTitle>
          <DialogDescription>
            Only the subject is required — everything else is optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Select
                value={String(draft.day)}
                onValueChange={(v) => set("day", Number(v) as DayNum)}
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.filter((d) => SCHOOL_DAYS.includes(d.num)).map((d) => (
                    <SelectItem key={d.num} value={String(d.num)}>
                      {d.long}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="week">Week</Label>
              <Select
                value={String(draft.week)}
                onValueChange={(v) => set("week", Number(v) as WeekNum)}
              >
                <SelectTrigger id="week">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_NUMS.map((w) => (
                    <SelectItem key={w} value={String(w)}>
                      {WEEK_LABELS[w]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="time"
                required
                value={draft.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="time"
                required
                value={draft.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              required
              maxLength={48}
              autoFocus={mode.kind === "create"}
              placeholder="e.g. Math"
              value={draft.subject}
              onChange={(e) => set("subject", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Input
                id="teacher"
                maxLength={48}
                placeholder="e.g. Ms. Wright"
                value={draft.teacher ?? ""}
                onChange={(e) => set("teacher", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                maxLength={16}
                placeholder="e.g. 12"
                value={draft.room ?? ""}
                onChange={(e) => set("room", e.target.value)}
              />
            </div>
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
                    <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The lesson <strong>{draft.subject || "untitled"}</strong>{" "}
                      will be permanently deleted. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteLesson.mutate(draft.id, {
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
              <Button type="submit" disabled={!draft.subject.trim() || busy}>
                {busy
                  ? "Saving…"
                  : mode.kind === "edit"
                    ? "Save"
                    : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
