"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { CalendarEvent, EventType } from "@/lib/calendar";
import type { LessonColor } from "@/lib/timetable";

interface DbEvent {
  id: string;
  userId: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string;
  subject: string | null;
  description: string | null;
  color: string | null;
  createdAt: string;
}

function rowToEvent(row: DbEvent): CalendarEvent {
  return {
    id: row.id,
    type: row.type as EventType,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    subject: row.subject ?? undefined,
    description: row.description ?? undefined,
    color: (row.color as LessonColor | null) ?? undefined,
    createdAt: row.createdAt,
  };
}

const EMPTY: CalendarEvent[] = [];

export function useEvents(): CalendarEvent[] {
  const { data } = useQuery<CalendarEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events", { credentials: "include" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`/api/events ${res.status}`);
      const body = (await res.json()) as { events: DbEvent[] };
      return body.events.map(rowToEvent);
    },
    placeholderData: EMPTY,
  });
  return data ?? EMPTY;
}

interface EventBody {
  type: EventType;
  title: string;
  startDate: string;
  endDate: string;
  subject?: string;
  description?: string;
  color?: LessonColor;
}

function eventToBody(e: Omit<CalendarEvent, "id" | "createdAt">): EventBody {
  return {
    type: e.type,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    subject: e.subject,
    description: e.description,
    color: e.color,
  };
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: Omit<CalendarEvent, "id" | "createdAt">) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventToBody(e)),
      });
      if (!res.ok) throw new Error(`Create failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: CalendarEvent) => {
      const res = await fetch(`/api/events/${e.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventToBody(e)),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
}
