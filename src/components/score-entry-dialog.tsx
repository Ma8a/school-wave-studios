"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MessageSquareText, Minus, Plus, Trash2 } from "lucide-react";
import { useLessons } from "@/components/api/use-lessons";
import {
  useCreateScoreEntry,
  useDeleteScoreEntry,
  useUpdateScoreEntry,
} from "@/components/api/use-score-entries";
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
  ENTRY_HEX,
  ENTRY_LABEL_SINGULAR,
  ENTRY_TYPES,
  newScoreEntryId,
  todayISO,
  type ScoreEntry,
  type ScoreEntryType,
} from "@/lib/scoreboard";
import type { Lesson } from "@/lib/timetable";
import { cn } from "@/lib/utils";

export type ScoreEntryDialogMode =
  | { kind: "create"; defaultType?: ScoreEntryType }
  | { kind: "edit"; entry: ScoreEntry };

interface ScoreEntryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: ScoreEntryDialogMode;
}

const TYPE_ICON = {
  plus: Plus,
  minus: Minus,
  remark: MessageSquareText,
} as const;

function emptyDraft(defaultType: ScoreEntryType = "plus"): ScoreEntry {
  return {
    id: newScoreEntryId(),
    type: defaultType,
    date: todayISO(),
    reason: "",
    subject: "",
    teacher: "",
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

function uniqueTeachers(lessons: Lesson[]): string[] {
  const set = new Set<string>();
  for (const l of lessons) {
    const t = l.teacher?.trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function ScoreEntryDialog({ open, onOpenChange, mode }: ScoreEntryDialogProps) {
  const createEntry = useCreateScoreEntry();
  const updateEntry = useUpdateScoreEntry();
  const deleteEntry = useDeleteScoreEntry();
  const lessons = useLessons();
  const busy =
    createEntry.isPending ||
    updateEntry.isPending ||
    deleteEntry.isPending;

  // Parent must remount via `key` when mode changes so initial draft is correct.
  const [draft, setDraft] = useState<ScoreEntry>(() =>
    mode.kind === "edit" ? mode.entry : emptyDraft(mode.defaultType),
  );

  const subjectSuggestions = useMemo(() => uniqueSubjects(lessons), [lessons]);
  const teacherSuggestions = useMemo(() => uniqueTeachers(lessons), [lessons]);

  const reasonRequired = draft.type === "remark";
  const reasonOk = !reasonRequired || (draft.reason?.trim().length ?? 0) > 0;

  function set<K extends keyof ScoreEntry>(k: K, v: ScoreEntry[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!reasonOk || busy) return;
    const cleaned: ScoreEntry = {
      ...draft,
      reason: draft.reason?.trim() || undefined,
      subject: draft.subject?.trim() || undefined,
      teacher: draft.teacher?.trim() || undefined,
    };
    if (mode.kind === "edit") {
      updateEntry.mutate(cleaned, { onSuccess: () => onOpenChange(false) });
    } else {
      const { id: _id, createdAt: _createdAt, ...payload } = cleaned;
      void _id;
      void _createdAt;
      createEntry.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit entry" : "Add entry"}
          </DialogTitle>
          <DialogDescription>
            Log a positive, negative, or teacher detention.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {ENTRY_TYPES.map((t) => {
                const selected = draft.type === t;
                const Icon = TYPE_ICON[t];
                const hex = ENTRY_HEX[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-md border-2 px-3 py-3 text-xs font-medium capitalize transition-all",
                      selected
                        ? "scale-[1.02] border-current"
                        : "border-border opacity-70 hover:opacity-100",
                    )}
                    style={selected ? { color: hex } : undefined}
                  >
                    <span
                      aria-hidden
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${hex}26`, color: hex }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    {ENTRY_LABEL_SINGULAR[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="entry-date">Date</Label>
              <Input
                id="entry-date"
                type="date"
                required
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-subject">Subject</Label>
              <Input
                id="entry-subject"
                maxLength={48}
                placeholder="e.g. Math"
                list="entry-subject-suggestions"
                value={draft.subject ?? ""}
                onChange={(e) => set("subject", e.target.value)}
              />
              <datalist id="entry-subject-suggestions">
                {subjectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-teacher">Teacher</Label>
            <Input
              id="entry-teacher"
              maxLength={48}
              placeholder="e.g. Ms. Wright"
              list="entry-teacher-suggestions"
              value={draft.teacher ?? ""}
              onChange={(e) => set("teacher", e.target.value)}
            />
            <datalist id="entry-teacher-suggestions">
              {teacherSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-reason">
              {draft.type === "remark" ? "Detention" : "Reason"}
              {reasonRequired && (
                <span className="ml-1 text-destructive" aria-hidden>
                  *
                </span>
              )}
              {!reasonRequired && (
                <span className="ml-1 text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              )}
            </Label>
            <textarea
              id="entry-reason"
              rows={3}
              maxLength={500}
              required={reasonRequired}
              placeholder={
                draft.type === "plus"
                  ? "What did you do well?"
                  : draft.type === "minus"
                    ? "What happened?"
                    : "What was the detention for?"
              }
              value={draft.reason ?? ""}
              onChange={(e) => set("reason", e.target.value)}
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
                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This {ENTRY_LABEL_SINGULAR[draft.type]} will be permanently
                      removed. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteEntry.mutate(draft.id, {
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
              <Button type="submit" disabled={!reasonOk || busy}>
                {busy ? "Saving…" : mode.kind === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
