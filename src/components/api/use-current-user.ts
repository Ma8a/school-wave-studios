"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  /** 1 = Week 1, 2 = Week 2 — drives which fortnight half Today shows. */
  currentWeek: 1 | 2;
}

/**
 * GET /api/me — returns the current user, or null if no valid session.
 * 401 from the server is converted to `null` rather than treated as an error,
 * because "not logged in" is a normal app state.
 */
export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`/api/me ${res.status}`);
      const data = (await res.json()) as { user: CurrentUser | null };
      return data.user ?? null;
    },
  });
}

/* ── Mutations ─────────────────────────────────────────────────────────── */

interface LoginInput {
  username: string;
  pin: string;
}

interface RegisterInput {
  username: string;
  name: string;
  pin: string;
}

interface AuthResponse {
  user: CurrentUser;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const error =
      typeof data.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(error);
  }
  return data as T;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      postJSON<AuthResponse>("/api/auth/login", input),
    onSuccess: (data) => {
      // Seed the cache so the UI flips to "signed in" without a round-trip.
      qc.setQueryData(["me"], data.user);
      qc.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      postJSON<AuthResponse>("/api/auth/register", input),
    onSuccess: (data) => {
      qc.setQueryData(["me"], data.user);
      qc.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => postJSON<{ ok: true }>("/api/auth/logout", {}),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      // Drop everything user-specific from cache.
      qc.removeQueries({ queryKey: ["lessons"] });
      qc.removeQueries({ queryKey: ["homework"] });
      qc.removeQueries({ queryKey: ["notes"] });
      qc.removeQueries({ queryKey: ["score-entries"] });
      qc.removeQueries({ queryKey: ["events"] });
      qc.removeQueries({ queryKey: ["decks"] });
    },
  });
}

/** PATCH /api/me — flip the user's current fortnight half (Week 1 ↔ Week 2). */
export function useUpdateCurrentWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currentWeek: 1 | 2) => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentWeek }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`,
        );
      }
      return (data as unknown as AuthResponse).user;
    },
    onSuccess: (user) => {
      qc.setQueryData(["me"], user);
    },
  });
}

/** PATCH /api/me — change display name. */
export function useUpdateName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`,
        );
      }
      return (data as unknown as AuthResponse).user;
    },
    onSuccess: (user) => {
      qc.setQueryData(["me"], user);
    },
  });
}

/** POST /api/me/change-pin — verify current PIN and set a new one. */
export function useChangePin() {
  return useMutation({
    mutationFn: async (payload: { currentPin: string; newPin: string }) => {
      await postJSON<{ ok: true }>("/api/me/change-pin", payload);
    },
  });
}

/** DELETE /api/me — nuke the account. Cascades to all entity tables. */
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me", {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`,
        );
      }
    },
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.clear();
    },
  });
}
