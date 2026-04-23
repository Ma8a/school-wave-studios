import type { Metadata } from "next";
import { CalendarList } from "@/components/calendar-list";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Tests, holidays, school trips, and other events. Grouped by when
          they&apos;re happening.
        </p>
      </header>
      <CalendarList />
    </div>
  );
}
