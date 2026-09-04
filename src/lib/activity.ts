import { useCallback, useEffect, useState } from "react";

export type ToolId = "email" | "notes" | "planner" | "research" | "chat";

export const TOOL_LABELS: Record<ToolId, string> = {
  email: "Smart Email",
  notes: "Meeting Notes",
  planner: "Task Planner",
  research: "Research",
  chat: "Workplace Chat",
};

/** Rough minutes of manual work saved per completed run, used for the time-saved indicator. */
export const MINUTES_SAVED: Record<ToolId, number> = {
  email: 12,
  notes: 25,
  planner: 20,
  research: 30,
  chat: 5,
};

export type ActivityEntry = {
  id: string;
  tool: ToolId;
  label: string;
  minutesSaved: number;
  at: number;
};

const KEY = "meridian.activity.v1";
const listeners = new Set<() => void>();

function read(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

export function logActivity(tool: ToolId, label: string) {
  if (typeof window === "undefined") return;
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tool,
    label,
    minutesSaved: MINUTES_SAVED[tool],
    at: Date.now(),
  };
  const next = [entry, ...read()].slice(0, 60);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  const sync = useCallback(() => setEntries(read()), []);

  useEffect(() => {
    sync();
    listeners.add(sync);
    window.addEventListener("storage", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const minutesSaved = entries.reduce((sum, e) => sum + e.minutesSaved, 0);
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.tool] = (acc[e.tool] ?? 0) + 1;
    return acc;
  }, {});
  const mostUsed = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    null) as ToolId | null;

  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = entries.filter((e) => e.at >= weekAgo).length;

  return {
    entries,
    completed: entries.length,
    minutesSaved,
    hoursSaved: Math.round((minutesSaved / 60) * 10) / 10,
    mostUsed,
    mostUsedCount: mostUsed ? counts[mostUsed] : 0,
    thisWeek,
  };
}

export function formatWhen(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  const yest = new Date(today.getTime() - 864e5);
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`;
  return `${d.toLocaleDateString([], { day: "numeric", month: "short" })} · ${time}`;
}
