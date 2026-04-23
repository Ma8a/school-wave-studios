"use client";

import { CalendarRange, Repeat } from "lucide-react";
import {
  useCurrentUser,
  useUpdateCurrentWeek,
} from "@/components/api/use-current-user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WEEK_LABELS, WEEK_NUMS, type WeekNum } from "@/lib/timetable";
import { cn } from "@/lib/utils";

/**
 * Lets the user flip between Week 1 and Week 2 at the start of each new
 * fortnight. The Today view reads `user.currentWeek` to know which set of
 * lessons to show. Schools without a fortnightly rotation can ignore this
 * entirely and leave it on Week 1 forever.
 */
export function CurrentWeekSection() {
  const { data: user } = useCurrentUser();
  const updateWeek = useUpdateCurrentWeek();

  if (!user) return null;
  const current: WeekNum = (user.currentWeek === 2 ? 2 : 1) as WeekNum;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" /> Current week
        </CardTitle>
        <CardDescription>
          Tells the Today view which fortnight half you&apos;re on. Tap the
          other week at the start of every new fortnight.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {WEEK_NUMS.map((w) => {
            const selected = current === w;
            return (
              <Button
                key={w}
                type="button"
                variant={selected ? "default" : "outline"}
                onClick={() => {
                  if (selected || updateWeek.isPending) return;
                  updateWeek.mutate(w);
                }}
                disabled={updateWeek.isPending}
                className={cn(
                  "h-auto flex-col gap-1 py-3",
                  selected ? "" : "hover:border-primary/50",
                )}
              >
                <Repeat className={cn("h-4 w-4", selected ? "" : "opacity-50")} />
                <span className="text-sm font-semibold">{WEEK_LABELS[w]}</span>
                {selected && (
                  <span className="text-[10px] uppercase tracking-wider opacity-80">
                    this week
                  </span>
                )}
              </Button>
            );
          })}
        </div>
        {updateWeek.isError && (
          <p className="mt-2 text-xs text-destructive">
            Couldn&apos;t switch — try again.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
