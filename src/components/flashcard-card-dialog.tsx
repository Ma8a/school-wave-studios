"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import {
  useCreateCard,
  useDeleteCard,
  useUpdateCard,
} from "@/components/api/use-decks";
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
import { Label } from "@/components/ui/label";
import { newCardId, type Flashcard } from "@/lib/flashcards";

export type CardDialogMode =
  | { kind: "create" }
  | { kind: "edit"; card: Flashcard };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  deckId: string;
  mode: CardDialogMode;
}

function emptyDraft(): Flashcard {
  return { id: newCardId(), front: "", back: "" };
}

export function FlashcardCardDialog({ open, onOpenChange, deckId, mode }: Props) {
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const busy =
    createCard.isPending || updateCard.isPending || deleteCard.isPending;

  const [draft, setDraft] = useState<Flashcard>(() =>
    mode.kind === "edit" ? mode.card : emptyDraft(),
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.front.trim() || !draft.back.trim() || busy) return;
    const cleaned = {
      front: draft.front.trim(),
      back: draft.back.trim(),
    };
    if (mode.kind === "edit") {
      updateCard.mutate(
        { deckId, card: { id: mode.card.id, ...cleaned } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createCard.mutate(
        { deckId, card: cleaned },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode.kind === "edit" ? "Edit card" : "Add card"}
          </DialogTitle>
          <DialogDescription>
            Front is what you see when studying. Back is the answer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="card-front">Front</Label>
            <textarea
              id="card-front"
              required
              rows={3}
              maxLength={500}
              autoFocus={mode.kind === "create"}
              placeholder="e.g. casa"
              value={draft.front}
              onChange={(e) => setDraft((d) => ({ ...d, front: e.target.value }))}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-back">Back</Label>
            <textarea
              id="card-back"
              required
              rows={3}
              maxLength={500}
              placeholder="e.g. house"
              value={draft.back}
              onChange={(e) => setDraft((d) => ({ ...d, back: e.target.value }))}
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
                    <AlertDialogTitle>Delete this card?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This card will be removed from the deck. This can&apos;t be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteCard.mutate(
                          { deckId, cardId: draft.id },
                          { onSuccess: () => onOpenChange(false) },
                        );
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
              <Button
                type="submit"
                disabled={!draft.front.trim() || !draft.back.trim() || busy}
              >
                {busy ? "Saving…" : mode.kind === "edit" ? "Save" : "Add"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
