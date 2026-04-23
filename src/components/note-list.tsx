"use client";

import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { useCreateNote, useNotes } from "@/components/api/use-notes";
import { NoteCard } from "@/components/note-card";
import { Button } from "@/components/ui/button";
import { compareNotesByUpdated } from "@/lib/notes";

export function NoteList() {
  const notes = useNotes();
  const createNote = useCreateNote();
  const router = useRouter();

  async function handleCreate() {
    if (createNote.isPending) return;
    // The server assigns the canonical id; we read it from the mutation
    // response so the router.push target is correct.
    const created = await createNote.mutateAsync({
      title: "",
      content: "",
      color: "amber",
    });
    router.push(`/notes/${created.id}`);
  }

  const sorted = [...notes].sort(compareNotesByUpdated);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {notes.length === 0
            ? "No notes yet."
            : `${notes.length} ${notes.length === 1 ? "note" : "notes"}.`}
        </p>
        <Button onClick={handleCreate} disabled={createNote.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          {createNote.isPending ? "Creating…" : "New note"}
        </Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState onCreate={handleCreate} disabled={createNote.isPending} />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {sorted.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  onCreate,
  disabled,
}: {
  onCreate: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={disabled}
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-60"
    >
      <FileText className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No notes yet</div>
        <p className="text-sm text-muted-foreground">
          Tap to write your first study note.
        </p>
      </div>
    </button>
  );
}
