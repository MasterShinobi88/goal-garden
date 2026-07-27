"use client";

import { uid, todayISO } from "./utils";
import type { CalendarEvent } from "./types";

export type UserEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  /** Optional time HH:mm local, null = all day */
  time: string | null;
  notes: string;
  color: string;
  created_at: string;
};

const KEY = "goal-garden:user-events";

const COLORS = [
  { id: "violet", hex: "#8b5cf6", label: "Violet" },
  { id: "sky", hex: "#38bdf8", label: "Sky" },
  { id: "amber", hex: "#fbbf24", label: "Amber" },
  { id: "rose", hex: "#fb7185", label: "Rose" },
  { id: "emerald", hex: "#34d399", label: "Emerald" },
];

export const EVENT_COLORS = COLORS;

function load(): UserEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as UserEvent[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function save(events: UserEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent("goal-garden:user-events"));
}

export function listUserEvents(): UserEvent[] {
  return load().sort((a, b) => a.date.localeCompare(b.date));
}

export function addUserEvent(input: {
  title: string;
  date: string;
  time?: string | null;
  notes?: string;
  color?: string;
}): UserEvent {
  const event: UserEvent = {
    id: uid(),
    title: input.title.trim(),
    date: input.date || todayISO(),
    time: input.time || null,
    notes: input.notes?.trim() || "",
    color: input.color || COLORS[0].hex,
    created_at: new Date().toISOString(),
  };
  const all = load();
  all.push(event);
  save(all);
  return event;
}

export function updateUserEvent(id: string, patch: Partial<UserEvent>) {
  const all = load().map((e) => (e.id === id ? { ...e, ...patch } : e));
  save(all);
}

export function deleteUserEvent(id: string) {
  save(load().filter((e) => e.id !== id));
}

export function userEventsToCalendar(events: UserEvent[]): CalendarEvent[] {
  return events.map((e) => {
    if (e.time) {
      const start = `${e.date}T${e.time}:00`;
      return {
        id: e.id,
        title: e.title,
        start,
        backgroundColor: e.color,
        borderColor: e.color,
        extendedProps: {
          type: "user-event",
          notes: e.notes,
        },
      };
    }
    return {
      id: e.id,
      title: e.title,
      start: e.date,
      allDay: true,
      backgroundColor: e.color,
      borderColor: e.color,
      extendedProps: {
        type: "user-event",
        notes: e.notes,
      },
    };
  });
}

export function eventsOnDate(date: string): UserEvent[] {
  return load().filter((e) => e.date === date);
}
