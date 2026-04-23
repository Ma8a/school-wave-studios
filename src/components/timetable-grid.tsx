"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentUser } from "@/components/api/use-current-user";
import { useLessons } from "@/components/api/use-lessons";
import { LessonCard } from "@/components/lesson-card";
import { LessonDialog, type LessonDialogMode } from "@/components/lesson-dialog";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DAYS,
  getCurrentDayNum,
  SCHOOL_DAYS,
  type DayNum,
} from "@/lib/time";
import {
  lessonsByDay,
  lessonsInWeek,
  WEEK_LABELS,
  WEEK_NUMS,
  type Lesson,
  type WeekNum,
} from "@/lib/timetable";
import { cn } from "@/lib/utils";

export function TimetableGrid() {
  const lessons = useLessons();
  const { data: user } = useCurrentUser();
  const today = getCurrentDayNum();
  const isWeekend = today > 5;
  const initialDayTab: DayNum = isWeekend ? 1 : today;
  const currentWeek: WeekNum = user?.currentWeek ?? 1;
  const [mobileWeek, setMobileWeek] = useState<WeekNum>(currentWeek);

  const [mode, setMode] = useState<LessonDialogMode | null>(null);
  const days = DAYS.filter((d) => SCHOOL_DAYS.includes(d.num));

  return (
    <div>
      {/* Mobile: Week toggle on top, then day tabs underneath. */}
      <div className="md:hidden">
        <Tabs
          value={String(mobileWeek)}
          onValueChange={(v) => setMobileWeek(Number(v) as WeekNum)}
          className="mb-3"
        >
          <TabsList className="grid w-full grid-cols-2">
            {WEEK_NUMS.map((w) => {
              const isCurrent = w === currentWeek;
              return (
                <TabsTrigger key={w} value={String(w)}>
                  {WEEK_LABELS[w]}
                  {isCurrent && (
                    <span
                      className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
                      aria-label="this week"
                    >
                      now
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <Tabs defaultValue={String(initialDayTab)}>
          <TabsList className="grid w-full grid-cols-5">
            {days.map((d) => {
              const isToday =
                !isWeekend && d.num === today && mobileWeek === currentWeek;
              return (
                <TabsTrigger key={d.num} value={String(d.num)} className="flex-col gap-0.5 py-2">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {d.short}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "block h-1 w-1 rounded-full",
                      isToday ? "bg-primary" : "bg-transparent",
                    )}
                  />
                </TabsTrigger>
              );
            })}
          </TabsList>

          {days.map((d) => {
            const ls = lessonsByDay(lessonsInWeek(lessons, mobileWeek), d.num);
            return (
              <TabsContent key={d.num} value={String(d.num)} className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{d.long}</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMode({
                        kind: "create",
                        defaultDay: d.num,
                        defaultWeek: mobileWeek,
                      })
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
                {ls.length === 0 ? (
                  <EmptyDay
                    onAdd={() =>
                      setMode({
                        kind: "create",
                        defaultDay: d.num,
                        defaultWeek: mobileWeek,
                      })
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {ls.map((l) => (
                      <LessonCard
                        key={l.id}
                        lesson={l}
                        onEdit={(lesson) => setMode({ kind: "edit", lesson })}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Desktop: two stacked week sections, each a 5-column day grid. */}
      <div className="hidden space-y-6 md:block">
        {WEEK_NUMS.map((w) => (
          <WeekSection
            key={w}
            week={w}
            isCurrentWeek={w === currentWeek}
            lessons={lessonsInWeek(lessons, w)}
            today={today}
            isWeekend={isWeekend}
            days={days}
            onAdd={(day) =>
              setMode({ kind: "create", defaultDay: day, defaultWeek: w })
            }
            onEdit={(lesson) => setMode({ kind: "edit", lesson })}
          />
        ))}
      </div>

      {mode && (
        <LessonDialog
          // Force remount when switching between create/edit so initial
          // form state is derived from the new mode without an effect.
          key={
            mode.kind === "edit"
              ? `edit-${mode.lesson.id}`
              : `create-${mode.defaultWeek ?? "1"}-${mode.defaultDay ?? "x"}`
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

function WeekSection({
  week,
  isCurrentWeek,
  lessons,
  today,
  isWeekend,
  days,
  onAdd,
  onEdit,
}: {
  week: WeekNum;
  isCurrentWeek: boolean;
  lessons: Lesson[];
  today: DayNum;
  isWeekend: boolean;
  days: ReadonlyArray<{ num: DayNum; short: string; long: string }>;
  onAdd: (day: DayNum) => void;
  onEdit: (lesson: Lesson) => void;
}) {
  return (
    <section>
      <header className="mb-3 flex items-baseline justify-between">
        <h2
          className={cn(
            "text-sm font-semibold uppercase tracking-wider",
            isCurrentWeek ? "text-primary" : "text-muted-foreground",
          )}
        >
          {WEEK_LABELS[week]}
          {isCurrentWeek && (
            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-primary">
              this week
            </span>
          )}
        </h2>
        <span className="text-xs text-muted-foreground">
          {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        {days.map((d) => {
          const ls = lessonsByDay(lessons, d.num);
          const isToday = isCurrentWeek && !isWeekend && d.num === today;
          return (
            <div
              key={d.num}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-card/50 p-3",
                isToday && "ring-1 ring-primary/40",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {d.short}
                  </div>
                  <h3
                    className={cn(
                      "text-sm font-semibold",
                      isToday && "text-primary",
                    )}
                  >
                    {d.long}
                  </h3>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Add lesson — ${WEEK_LABELS[week]}, ${d.long}`}
                  onClick={() => onAdd(d.num)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {ls.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onAdd(d.num)}
                  className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  No lessons.
                  <br />
                  Tap to add.
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {ls.map((l) => (
                    <LessonCard key={l.id} lesson={l} onEdit={onEdit} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyDay({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="block w-full rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
    >
      No lessons this day. Tap to add your first.
    </button>
  );
}
