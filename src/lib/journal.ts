"use client";

import { uid, todayISO } from "./utils";

export type JournalMood =
  | "great"
  | "good"
  | "okay"
  | "low"
  | "tough"
  | "grateful";

export type JournalEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  mood: JournalMood | null;
  tags: string[];
  /** Optional linked goal id */
  goal_id: string | null;
  created_at: string;
  updated_at: string;
};

const KEY = "goal-garden:journal";

export const MOOD_OPTIONS: {
  id: JournalMood;
  label: string;
  emoji: string;
}[] = [
  { id: "great", label: "Great", emoji: "🌟" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "low", label: "Low", emoji: "😔" },
  { id: "tough", label: "Tough", emoji: "🌧️" },
  { id: "grateful", label: "Grateful", emoji: "💚" },
];

function loadAll(): JournalEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as JournalEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveAll(entries: JournalEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("goal-garden:journal"));
}

export function listJournalEntries(): JournalEntry[] {
  return loadAll().sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export function getJournalEntry(id: string): JournalEntry | null {
  return loadAll().find((e) => e.id === id) ?? null;
}

export function createJournalEntry(input: {
  date?: string;
  title?: string;
  body?: string;
  mood?: JournalMood | null;
  tags?: string[];
  goal_id?: string | null;
}): JournalEntry {
  const now = new Date().toISOString();
  const entry: JournalEntry = {
    id: uid(),
    date: input.date || todayISO(),
    title: (input.title || "").trim() || "Untitled",
    body: input.body || "",
    mood: input.mood ?? null,
    tags: input.tags ?? [],
    goal_id: input.goal_id ?? null,
    created_at: now,
    updated_at: now,
  };
  const all = loadAll();
  all.unshift(entry);
  saveAll(all);
  return entry;
}

export function updateJournalEntry(
  id: string,
  patch: Partial<
    Pick<JournalEntry, "date" | "title" | "body" | "mood" | "tags" | "goal_id">
  >
): JournalEntry | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next: JournalEntry = {
    ...all[idx],
    ...patch,
    title:
      patch.title !== undefined
        ? patch.title.trim() || "Untitled"
        : all[idx].title,
    updated_at: new Date().toISOString(),
  };
  all[idx] = next;
  saveAll(all);
  return next;
}

export function deleteJournalEntry(id: string): boolean {
  const all = loadAll();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}

export function journalStats() {
  const all = loadAll();
  const thisMonth = todayISO().slice(0, 7);
  const monthCount = all.filter((e) => e.date.startsWith(thisMonth)).length;
  // streak: consecutive days with at least one entry ending today or yesterday
  const days = new Set(all.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  // if no entry today, start from yesterday for "current" streak feel
  if (!days.has(todayISO())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 365; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    if (days.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return {
    total: all.length,
    thisMonth: monthCount,
    streak,
  };
}

export function moodMeta(mood: JournalMood | null) {
  if (!mood) return null;
  return MOOD_OPTIONS.find((m) => m.id === mood) ?? null;
}
