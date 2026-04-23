import type { Metadata } from "next";
import { Scoreboard } from "@/components/scoreboard";

export const metadata: Metadata = { title: "Scoreboard" };

export default function ScoreboardPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Scoreboard</h1>
        <p className="text-muted-foreground">
          Track positives, negatives, and teacher detentions. Tap any
          quick-add button to log instantly.
        </p>
      </header>
      <Scoreboard />
    </div>
  );
}
