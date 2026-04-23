import type { Metadata } from "next";
import { NoteList } from "@/components/note-list";

export const metadata: Metadata = { title: "Notes" };

export default function NotesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
        <p className="text-muted-foreground">
          Your cheat sheets and study guides. Markdown supported — bold,
          headings, lists, code, tables, and more.
        </p>
      </header>
      <NoteList />
    </div>
  );
}
