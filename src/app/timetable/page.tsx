import type { Metadata } from "next";
import { TimetableGrid } from "@/components/timetable-grid";

export const metadata: Metadata = { title: "Timetable" };

export default function TimetablePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground">
          Your full week. Tap a lesson to edit it, or the plus button to add a
          new one.
        </p>
      </header>
      <TimetableGrid />
    </div>
  );
}
