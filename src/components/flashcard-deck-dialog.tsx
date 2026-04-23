"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  useCreateDeck,
  useDeleteDeck,
  useUpdateDeck,
} from "@/components/api/use-decks";
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
  newDeckId,
  type FlashcardDeck,
} from "@/lib/flashcards";
import {
  LESSON_COLOR_KEYS,
  LESSON_COLORS,
  type Lesson,
  type LessonColor,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export type DeckDialogMode =
  | { kind: "create" }
  | { kind: "edit"; deck: FlashcardDeck };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: DeckDialogMode;
}

function emptyDraft(): FlashcardDeck {
  const now = new Date().toISOString();
  return {
    id: newDeckId(),
    title: "",
    subject: "",
    description: "",
    color: "amber",
    cards: [],
    createdAt: now,
    updatedAt: now,
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

export function FlashcardDeckDialog({ open, onOpenChange, mode }: Props) {
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const deleteDeck = useDeleteDeck();
  const lessons = useLessons();
  const router = useRouter();
  const busy =
    createDeck.isPending || updateDeck.isPending || deleteDeck.isPending;

  const [draft, setDraft] = useState<FlashcardDeck>(() =>
    mode.kind === "edit" ? mode.deck : emptyDraft(),
  );

  const subjectSuggestions = useMemo(() => uniqueSubjects(lessons), [lessons]);

  function set<K extends keyof FlashcardDeck>(k: K, v: FlashcardDeck[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || busy) return;
    const cleaned = {
      title: draft.title.trim(),
      subject: draft.subject?.trim() || undefined,
      description: draft.description?.trim() || undefined,
      color: draft.color,
    };
    if (mode.kind === "edit") {
      updateDeck.mutate(
        { ...mode.deck, ...cleaned },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      // Server assigns the canonical id; route to the new deck on success
      // so the user can start adding cards immediately.
      const created = await createDeck.mutateAsync(cleaned);
      onOpenChange(false);
      router.push(`/flashcards/${created.id}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit deck" : "New deck"}
          </DialogTitle>
          <DialogDescription>
            A deck holds a set of flashcards on one topic.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="deck-title">Title</Label>
            <Input
              id="deck-title"
              required
              maxLength={80}
              autoFocus={mode.kind === "create"}
              placeholder="e.g. Spanish vocabulary — week 3"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deck-subject">Subject</Label>
              <Input
                id="deck-subject"
                maxLength={48}
                placeholder="e.g. Spanish"
                list="deck-subject-suggestions"
                value={draft.subject ?? ""}
                onChange={(e) => set("subject", e.target.value)}
              />
              <datalist id="deck-subject-suggestions">
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
            <Label htmlFor="deck-description">Description (optional)</Label>
            <textarea
              id="deck-description"
              rows={2}
              maxLength={200}
              placeholder="What's this deck for?"
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
                  Delete deck
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{draft.title || "Untitled deck"}</strong> and all{" "}
                      {draft.cards.length} of its cards will be permanently
                      deleted. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteDeck.mutate(draft.id, {
                          onSuccess: () => {
                            onOpenChange(false);
                            router.replace("/flashcards");
                          },
                        });
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete deck
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
                    : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
