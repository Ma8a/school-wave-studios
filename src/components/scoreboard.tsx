"use client";

import { useState } from "react";
import { MessageSquareText, Minus, Plus, Trophy } from "lucide-react";
import {
  useCreateScoreEntry,
  useScoreEntries,
} from "@/components/api/use-score-entries";
import { ScoreEntryCard } from "@/components/score-entry-card";
import {
  ScoreEntryDialog,
  type ScoreEntryDialogMode,
} from "@/components/score-entry-dialog";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  compareEntriesByDateDesc,
  countByType,
  ENTRY_HEX,
  ENTRY_LABELS,
  filterByPeriod,
  PERIOD_LABELS,
  PERIODS,
  todayISO,
  type Period,
  type ScoreEntryType,
} from "@/lib/scoreboard";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  plus: Plus,
  minus: Minus,
  remark: MessageSquareText,
} as const;

export function Scoreboard() {
  const scoreEntries = useScoreEntries();
  const createEntry = useCreateScoreEntry();
  const [period, setPeriod] = useState<Period>("week");
  const [mode, setMode] = useState<ScoreEntryDialogMode | null>(null);

  const inPeriod = filterByPeriod(scoreEntries, period);
  const counts = countByType(inPeriod);
  const sorted = [...inPeriod].sort(compareEntriesByDateDesc);

  /** One-tap add for plus/minus — no dialog, no extra fields. */
  function quickAdd(type: ScoreEntryType) {
    if (type === "remark") {
      // Remarks need text — open the dialog instead.
      setMode({ kind: "create", defaultType: "remark" });
      return;
    }
    if (createEntry.isPending) return;
    createEntry.mutate({
      type,
      date: todayISO(),
    });
  }

  return (
    <div className="space-y-6">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          {PERIODS.map((p) => (
            <TabsTrigger key={p} value={p}>
              {PERIOD_LABELS[p]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(counts) as ScoreEntryType[]).map((type) => (
          <StatCard
            key={type}
            type={type}
            count={counts[type]}
            period={period}
            onQuickAdd={() => quickAdd(type)}
          />
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent entries</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode({ kind: "create" })}
          >
            Add with details
          </Button>
        </div>
        {sorted.length === 0 ? (
          <EmptyState period={period} />
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((e) => (
              <ScoreEntryCard
                key={e.id}
                entry={e}
                onEdit={(entry) => setMode({ kind: "edit", entry })}
              />
            ))}
          </div>
        )}
      </section>

      {mode && (
        <ScoreEntryDialog
          key={mode.kind === "edit" ? `edit-${mode.entry.id}` : `create-${mode.defaultType ?? "plus"}`}
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

function StatCard({
  type,
  count,
  period,
  onQuickAdd,
}: {
  type: ScoreEntryType;
  count: number;
  period: Period;
  onQuickAdd: () => void;
}) {
  const Icon = TYPE_ICON[type];
  const hex = ENTRY_HEX[type];
  const periodLabel = PERIOD_LABELS[period].toLowerCase();
  const displayCount =
    type === "plus" && count > 0 ? `+${count}` : type === "minus" && count > 0 ? `−${count}` : count;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: `${hex}26`, color: hex }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span className="text-sm font-semibold">{ENTRY_LABELS[type]}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={cn(
            "text-3xl font-semibold tabular-nums",
            count === 0 && "text-muted-foreground",
          )}
          style={count > 0 ? { color: hex } : undefined}
        >
          {displayCount}
        </span>
        <span className="text-xs text-muted-foreground">{periodLabel}</span>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onQuickAdd}
        className="mt-3 self-start"
        aria-label={
          type === "remark"
            ? "Add detention"
            : type === "plus"
              ? "Add positive"
              : "Add negative"
        }
      >
        {type === "remark" ? (
          <>
            <MessageSquareText className="mr-1 h-3.5 w-3.5" />
            Add detention
          </>
        ) : (
          <>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {type === "plus" ? "Add positive" : "Add negative"}
          </>
        )}
      </Button>
    </div>
  );
}

function EmptyState({ period }: { period: Period }) {
  const periodLabel = PERIOD_LABELS[period].toLowerCase();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
      <Trophy className="h-8 w-8 text-muted-foreground" />
      <div>
        <div className="font-semibold">No entries {periodLabel}</div>
        <p className="text-sm text-muted-foreground">
          Tap the buttons above to log a positive, negative, or teacher detention.
        </p>
      </div>
    </div>
  );
}
