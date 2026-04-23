"use client";

import { useState } from "react";
import { Plus, Inbox } from "lucide-react";
import { useHomework } from "@/components/api/use-homework";
import { HomeworkCard } from "@/components/homework-card";
import {
  HomeworkDialog,
  type HomeworkDialogMode,
} from "@/components/homework-dialog";
import { Button } from "@/components/ui/button";
import {
  BUCKET_LABELS,
  BUCKET_ORDER,
  groupHomeworkByBucket,
  type Homework,
  type HomeworkBucket,
} from "@/lib/homework";
import { cn } from "@/lib/utils";

export function HomeworkList() {
  const homework = useHomework();
  const [mode, setMode] = useState<HomeworkDialogMode | null>(null);

  const groups = groupHomeworkByBucket(homework);
  const totalActive = homework.filter((h) => !h.done).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {totalActive === 0
            ? "All caught up — nothing pending."
            : `${totalActive} ${totalActive === 1 ? "task" : "tasks"} pending.`}
        </p>
        <Button onClick={() => setMode({ kind: "create" })}>
          <Plus className="mr-1 h-4 w-4" />
          Add homework
        </Button>
      </div>

      {homework.length === 0 ? (
        <EmptyState onAdd={() => setMode({ kind: "create" })} />
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
                onEdit={(homework) => setMode({ kind: "edit", homework })}
              />
            );
          })}
        </div>
      )}

      {mode && (
        <HomeworkDialog
          key={mode.kind === "edit" ? `edit-${mode.homework.id}` : "create"}
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
  bucket: HomeworkBucket;
  items: Homework[];
  onEdit: (h: Homework) => void;
}) {
  const tone =
    bucket === "overdue"
      ? "text-destructive"
      : bucket === "today"
        ? "text-primary"
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
        {items.map((h) => (
          <HomeworkCard key={h.id} homework={h} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:text-foreground"
    >
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No homework yet</div>
        <p className="text-sm text-muted-foreground">
          Tap to add your first assignment.
        </p>
      </div>
    </button>
  );
}
