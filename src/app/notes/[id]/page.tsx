"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useLessons } from "@/components/api/use-lessons";
import {
  useDeleteNote,
  useNotesQuery,
  useUpdateNote,
} from "@/components/api/use-notes";
import { Markdown } from "@/components/markdown";
import { relativeTimeLabel, type Note } from "@/lib/notes";
import {
  LESSON_COLOR_KEYS,
  LESSON_COLORS,
  type Lesson,
  type LessonColor,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export default function NoteDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  // Fresh state per id — guarantees a clean editor when navigating between notes.
  return <NoteDetailGate key={id} id={id} />;
}

function NoteDetailGate({ id }: { id: string }) {
  const notesQuery = useNotesQuery();

  // While the list is fetching for the first time, show a spinner. If the
  // query errored, fall through — the NotFound view below is the right
  // fallback. Once `data` is populated we know whether the note exists.
  if (notesQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  const note = notesQuery.data?.find((n) => n.id === id);
  if (!note) return <NotFound />;
  return <NoteDetail note={note} />;
}

function uniqueSubjects(lessons: Lesson[]): string[] {
  const set = new Set<string>();
  for (const l of lessons) {
    const s = l.subject?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function colorForSubject(lessons: Lesson[], subject: string): LessonColor | null {
  const target = subject.trim().toLowerCase();
  if (!target) return null;
  return lessons.find((l) => l.subject.trim().toLowerCase() === target)?.color ?? null;
}

function NoteDetail({ note }: { note: Note }) {
  const lessons = useLessons();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const router = useRouter();

  // New notes are created empty by the list page; auto-enter edit mode when
  // we land on a note that has no title AND no content.
  const startEmpty = !note.title && !note.content;
  const [editing, setEditing] = useState<boolean>(startEmpty);
  const [draft, setDraft] = useState<Note | null>(() =>
    startEmpty ? { ...note } : null,
  );

  const subjectSuggestions = useMemo(() => uniqueSubjects(lessons), [lessons]);
  const datalistId = "note-subject-suggestions";

  function startEdit() {
    setDraft({ ...note });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
  }

  function save() {
    if (!draft || updateNote.isPending) return;
    updateNote.mutate(
      {
        ...draft,
        title: draft.title.trim() || "Untitled note",
        subject: draft.subject?.trim() || undefined,
      },
      {
        onSuccess: () => {
          setEditing(false);
          setDraft(null);
        },
      },
    );
  }

  function removeNote() {
    if (deleteNote.isPending) return;
    deleteNote.mutate(note.id, {
      onSuccess: () => router.replace("/notes"),
    });
  }

  function set<K extends keyof Note>(k: K, v: Note[K]) {
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  }

  function changeSubject(value: string) {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, subject: value };
      const matched = colorForSubject(lessons, value);
      if (matched) next.color = matched;
      return next;
    });
  }

  const color = LESSON_COLORS[note.color ?? "neutral"];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Button
          nativeButton={false}
          render={<Link href="/notes" />}
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          All notes
        </Button>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={updateNote.isPending}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={!draft || updateNote.isPending}
              >
                <Save className="mr-1 h-4 w-4" />
                {updateNote.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{note.title || "Untitled note"}</strong> will be
                      permanently deleted. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={removeNote}
                      disabled={deleteNote.isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteNote.isPending ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" onClick={startEdit}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && draft ? (
        <EditView
          draft={draft}
          set={set}
          changeSubject={changeSubject}
          datalistId={datalistId}
          subjectSuggestions={subjectSuggestions}
        />
      ) : (
        <ReadView note={note} colorHex={color.hex} />
      )}
    </div>
  );
}

function ReadView({ note, colorHex }: { note: Note; colorHex: string }) {
  return (
    <article>
      <header className="mb-6 flex items-start gap-3 border-b border-border pb-5">
        <span
          aria-hidden
          className="mt-2 h-8 w-1.5 rounded-full"
          style={{ backgroundColor: colorHex }}
        />
        <div className="flex-1 space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {note.title || "Untitled note"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {note.subject && <span>{note.subject}</span>}
            <span>Updated {relativeTimeLabel(note.updatedAt)}</span>
          </div>
        </div>
      </header>
      <Markdown content={note.content} />
    </article>
  );
}

interface EditViewProps {
  draft: Note;
  set: <K extends keyof Note>(k: K, v: Note[K]) => void;
  changeSubject: (value: string) => void;
  datalistId: string;
  subjectSuggestions: string[];
}

function EditView({
  draft,
  set,
  changeSubject,
  datalistId,
  subjectSuggestions,
}: EditViewProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={100}
          placeholder="e.g. Photosynthesis cheat sheet"
          autoFocus={!draft.title && !draft.content}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="note-subject">Subject</Label>
          <Input
            id="note-subject"
            value={draft.subject ?? ""}
            onChange={(e) => changeSubject(e.target.value)}
            maxLength={48}
            placeholder="e.g. Biology"
            list={datalistId}
          />
          <datalist id={datalistId}>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="note-content">Content</Label>
        <Tabs defaultValue="write">
          <TabsList>
            <TabsTrigger value="write">
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-1 h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-3">
            <textarea
              id="note-content"
              value={draft.content}
              onChange={(e) => set("content", e.target.value)}
              rows={16}
              placeholder={`# Heading\n\nWrite your notes here.\n\n- Bullet point\n- **Bold** and *italic*\n- Use \`code\` for code\n\n| Subject | Score |\n|---------|-------|\n| Math    |  9/10 |`}
              className="block w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm leading-relaxed shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Markdown: # for headings, **bold**, *italic*, - for bullets,
              `code`, &gt; for quotes, | for tables.
            </p>
          </TabsContent>
          <TabsContent
            value="preview"
            className="mt-3 min-h-[16rem] rounded-md border border-border bg-card p-4"
          >
            <Markdown content={draft.content} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Note not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The note you&apos;re looking for has been deleted or never existed.
      </p>
      <Button
        nativeButton={false}
        render={<Link href="/notes" />}
        variant="outline"
        className="mt-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to notes
      </Button>
    </div>
  );
}
