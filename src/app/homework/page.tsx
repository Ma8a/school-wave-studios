import type { Metadata } from "next";
import { HomeworkList } from "@/components/homework-list";

export const metadata: Metadata = { title: "Homework" };

export default function HomeworkPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Homework</h1>
        <p className="text-muted-foreground">
          Track what&apos;s due. Tap a task to edit, the circle to mark done.
        </p>
      </header>
      <HomeworkList />
    </div>
  );
}
