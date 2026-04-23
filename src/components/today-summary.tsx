"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ClipboardList, Sun } from "lucide-react";
import { useCurrentUser } from "@/components/api/use-current-user";
import { useHomework } from "@/components/api/use-homework";
import { useLessons } from "@/components/api/use-lessons";
import { LessonCard } from "@/components/lesson-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DAYS,
  dayLabel,
  getCurrentDayNum,
  minutesBetween,
  nowHHMM,
} from "@/lib/time";
import {
  lessonsByDay,
  lessonsInWeek,
  WEEK_LABELS,
} from "@/lib/timetable";
import { classifyHomework } from "@/lib/homework";

function greetForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function TodaySummary() {
  const { data: user } = useCurrentUser();
  const lessons = useLessons();
  const homework = useHomework();
  const [now, setNow] = useState(() => nowHHMM());

  useEffect(() => {
    const id = setInterval(() => setNow(nowHHMM()), 30_000);
    return () => clearInterval(id);
  }, []);

  const today = getCurrentDayNum();
  const isWeekend = today > 5;
  const displayDay = isWeekend ? 1 : today;
  const currentWeek = user?.currentWeek ?? 1;
  // Filter to the user's current fortnight half before picking out today's day.
  const todayLessons = lessonsByDay(
    lessonsInWeek(lessons, currentWeek),
    displayDay,
  );

  const current = todayLessons.find((l) => l.startTime <= now && l.endTime > now);
  const next = todayLessons.find((l) => l.startTime > now);

  const overdueCount = homework.filter((h) => classifyHomework(h) === "overdue").length;
  const dueTodayCount = homework.filter((h) => classifyHomework(h) === "today").length;
  const showHomeworkBanner = overdueCount + dueTodayCount > 0;

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  const greeting = greetForHour(new Date().getHours());

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {dayLabel(today)} · {dateLabel} · {WEEK_LABELS[currentWeek]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting}, {user?.name ?? "..."}!
        </h1>
        {isWeekend ? (
          <p className="text-muted-foreground">
            It&apos;s the weekend — take a break. Showing {DAYS[0].long}&apos;s
            schedule below.
          </p>
        ) : todayLessons.length === 0 ? (
          <p className="text-muted-foreground">No lessons scheduled for today.</p>
        ) : (
          <p className="text-muted-foreground">
            You have {todayLessons.length}{" "}
            {todayLessons.length === 1 ? "lesson" : "lessons"} today.
          </p>
        )}
      </header>

      {showHomeworkBanner && (
        <Link
          href="/homework"
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40"
        >
          <span
            className={
              overdueCount > 0
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            }
          >
            {overdueCount > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <ClipboardList className="h-5 w-5" />
            )}
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold">
              {overdueCount > 0 && (
                <span className="text-destructive">
                  {overdueCount} overdue
                </span>
              )}
              {overdueCount > 0 && dueTodayCount > 0 && (
                <span className="text-muted-foreground"> · </span>
              )}
              {dueTodayCount > 0 && (
                <span>
                  {dueTodayCount} due today
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tap to open your homework list.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {(current || next) && !isWeekend && (
        <section className="grid gap-3 sm:grid-cols-2">
          {current && (
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LessonCard lesson={current} active />
              </CardContent>
            </Card>
          )}
          {next && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <LessonCard lesson={next} />
                <p className="text-xs text-muted-foreground">
                  Starts in {Math.max(0, minutesBetween(now, next.startTime))} min
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isWeekend ? "Monday's schedule" : "Today's lessons"}
          </h2>
          <Button
            nativeButton={false}
            render={<Link href="/timetable" />}
            size="sm"
            variant="ghost"
          >
            Full timetable
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        {todayLessons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Sun className="h-8 w-8 text-primary/60" />
              <p>
                Free day! Enjoy it — or check your{" "}
                <Link href="/timetable" className="underline">
                  full timetable
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {todayLessons.map((l) => (
              <LessonCard key={l.id} lesson={l} active={l.id === current?.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
