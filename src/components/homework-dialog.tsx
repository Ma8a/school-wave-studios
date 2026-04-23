"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateHomework,
  useDeleteHomework,
  useUpdateHomework,
} from "@/components/api/use-homework";
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
  newHomeworkId,
  todayISO,
  type Homework,
} from "@/lib/homework";
import {
  LESSON_COLOR_KEYS,
  LESSON_COLORS,
  type Lesson,
  type LessonColor,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export type HomeworkDialogMode =
  | { kind: "create" }
  | { kind: "edit"; homework: Homework };

interface HomeworkDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: HomeworkDialogMode;
}

function emptyDraft(): Homework {
  return {
    id: newHomeworkId(),
    title: "",
    subject: "",
    dueDate: todayISO(),
    description: "",
    done: false,
    createdAt: new Date().toISOString(),
    color: "amber",
  };
}

/**
 * Pull the unique subject names already on the timetable so the homework
 * subject input can offer autocomplete from the user's real classes.
 */
function uniqueSubjects(lessons: Lesson[]): string[] {
  const set = new Set<string>();
  for (const l of lessons) {
    const s = l.subject?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Pick the matching lesson color for a typed subject (case-insensitive). */
function colorForSubject(lessons: Lesson[], subject: string): LessonColor | null {
  const target = subject.trim().toLowerCase();
  if (!target) return null;
  const match = lessons.find((l) => l.subject.trim().toLowerCase() === target);
  return match?.color ?? null;
}

export function HomeworkDialog({ open, onOpenChange, mode }: HomeworkDialogProps) {
  const createHomework = useCreateHomework();
  const updateHomework = useUpdateHomework();
  const deleteHomework = useDeleteHomework();
  const lessons = useLessons();

  // Parent must remount via `key` when mode changes so initial draft is correct.
  const [draft, setDraft] = useState<Homework>(() =>
    mode.kind === "edit" ? mode.homework : emptyDraft(),
  );

  const busy =
    createHomework.isPending ||
    updateHomework.isPending ||
    deleteHomework.isPending;

  const subjectSuggestions = useMemo(() => uniqueSubjects(lessons), [lessons]);
  const datalistId = "homework-subject-suggestions";

  function set<K extends keyof Homework>(k: K, v: Homework[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function changeSubject(value: string) {
    setDraft((d) => {
      const next = { ...d, subject: value };
      // Only auto-update color if the user picked a known subject AND
      // hasn't manually overridden the color (or matched the previous subject's).
      const newColor = colorForSubject(lessons, value);
      if (newColor) next.color = newColor;
      return next;
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || busy) return;
    const cleaned: Homework = {
      ...draft,
      title: draft.title.trim(),
      subject: draft.subject?.trim() || undefined,
      description: draft.description?.trim() || undefined,
    };
    if (mode.kind === "edit") {
      updateHomework.mutate(cleaned, { onSuccess: () => onOpenChange(false) });
    } else {
      const { id: _ignore, createdAt: _ignore2, ...payload } = cleaned;
      void _ignore;
      void _ignore2;
      createHomework.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit homework" : "Add homework"}
          </DialogTitle>
          <DialogDescription>
            Only the title and due date are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="hw-title">Title</Label>
            <Input
              id="hw-title"
              required
              maxLength={80}
              autoFocus={mode.kind === "create"}
              placeholder="e.g. Read chapter 5"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hw-due">Due date</Label>
              <Input
                id="hw-due"
                type="date"
                required
                value={draft.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hw-subject">Subject</Label>
              <Input
                id="hw-subject"
                maxLength={48}
                placeholder="e.g. Math"
                list={datalistId}
                value={draft.subject ?? ""}
                onChange={(e) => changeSubject(e.target.value)}
              />
              <datalist id={datalistId}>
                {subjectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
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
                    onClick={() => set("color", c)}
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

          <div className="space-y-2">
            <Label htmlFor="hw-desc">Notes (optional)</Label>
            <textarea
              id="hw-desc"
              rows={3}
              maxLength={500}
              placeholder="Anything extra you want to remember…"
              value={draft.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <AlertDialogTitle>Delete this homework?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{draft.title || "Untitled homework"}</strong> will
                      be permanently deleted. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteHomework.mutate(draft.id, {
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
