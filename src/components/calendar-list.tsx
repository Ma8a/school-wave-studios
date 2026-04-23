"use client";

import { useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import { useEvents } from "@/components/api/use-events";
import { CalendarEventCard } from "@/components/calendar-event-card";
import {
  CalendarEventDialog,
  type CalendarEventDialogMode,
} from "@/components/calendar-event-dialog";
import { Button } from "@/components/ui/button";
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  groupEventsByBucket,
  type CalendarEvent,
  type EventBucket,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function CalendarList() {
  const events = useEvents();
  const [mode, setMode] = useState<CalendarEventDialogMode | null>(null);

  const groups = groupEventsByBucket(events);
  const upcomingCount =
    groups.thisWeek.length + groups.comingUp.length + groups.later.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {events.length === 0
            ? "Nothing scheduled."
            : `${upcomingCount} upcoming · ${groups.past.length} past`}
        </p>
        <Button onClick={() => setMode({ kind: "create" })}>
          <Plus className="mr-1 h-4 w-4" />
          Add event
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState onCreate={() => setMode({ kind: "create" })} />
      ) : (
        <div className="space-y-6">
          {BUCKET_ORDER.map((bucket) => {
            const items = groups[bucket];
            if (items.length === 0) return null;
            return (
              <BucketSection
                key={bucket}
                bucket={bucket}
                items={items}
                onEdit={(event) => setMode({ kind: "edit", event })}
              />
            );
          })}
        </div>
      )}

      {mode && (
        <CalendarEventDialog
          key={
            mode.kind === "edit"
              ? `edit-${mode.event.id}`
              : `create-${mode.defaultType ?? "test"}`
          }
          open
          onOpenChange={(v) => {
            if (!v) setMode(null);
          }}
          mode={mode}
        />
      )}
    </div>
  );
}

function BucketSection({
  bucket,
  items,
  onEdit,
}: {
  bucket: EventBucket;
  items: CalendarEvent[];
  onEdit: (e: CalendarEvent) => void;
}) {
  const tone =
    bucket === "thisWeek"
      ? "text-primary"
      : bucket === "past"
        ? "text-muted-foreground/70"
        : "text-muted-foreground";

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className={cn("text-xs font-semibold uppercase tracking-wider", tone)}>
          {BUCKET_LABELS[bucket]}
        </h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((e) => (
          <CalendarEventCard key={e.id} event={e} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:text-foreground"
    >
      <CalendarRange className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No events yet</div>
        <p className="text-sm text-muted-foreground">
          Tap to add a test, holiday, trip, or anything else worth remembering.
        </p>
      </div>
    </button>
  );
}
