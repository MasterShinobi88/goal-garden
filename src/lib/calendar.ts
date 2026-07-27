import { addDays, addHours, format, parseISO, setHours, setMinutes } from "date-fns";
import type { BusySlot, CalendarEvent, DailyTask, GoalWithTree } from "./types";
import { uid } from "./utils";

/** Mock Google/Outlook busy slots for conflict detection without OAuth */
export function getMockBusySlots(days = 28): BusySlot[] {
  const slots: BusySlot[] = [];
  const base = new Date();
  const patterns = [
    { dayOffset: 1, hour: 10, title: "Team standup", hours: 0.5 },
    { dayOffset: 1, hour: 14, title: "Client call", hours: 1 },
    { dayOffset: 2, hour: 9, title: "Deep work block (protected)", hours: 2 },
    { dayOffset: 3, hour: 15, title: "Dentist", hours: 1 },
    { dayOffset: 5, hour: 11, title: "1:1 with manager", hours: 0.5 },
    { dayOffset: 8, hour: 13, title: "Workshop", hours: 3 },
    { dayOffset: 10, hour: 16, title: "Kids soccer", hours: 1.5 },
    { dayOffset: 14, hour: 10, title: "All-hands", hours: 1 },
  ];

  for (const p of patterns) {
    if (p.dayOffset >= days) continue;
    const day = addDays(base, p.dayOffset);
    const start = setMinutes(setHours(day, p.hour), 0);
    const end = addHours(start, p.hours);
    slots.push({
      id: uid(),
      title: p.title,
      start: start.toISOString(),
      end: end.toISOString(),
      source: "mock",
    });
  }
  return slots;
}

export function tasksToEvents(
  goals: GoalWithTree[],
  color = "#22c55e"
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const g of goals) {
    if (g.archived) continue;
    for (const m of g.milestones) {
      for (const t of m.daily_tasks) {
        events.push({
          id: t.id,
          title: `${t.completed ? "✓ " : ""}${t.title}`,
          start: t.scheduled_date,
          allDay: true,
          backgroundColor: t.completed ? "#166534" : color,
          borderColor: t.completed ? "#14532d" : "#16a34a",
          extendedProps: {
            type: "task",
            completed: t.completed,
            goalId: g.id,
            milestoneId: m.id,
          },
        });
      }
    }
  }
  return events;
}

export function busyToEvents(slots: BusySlot[]): CalendarEvent[] {
  return slots.map((s) => ({
    id: s.id,
    title: `📅 ${s.title}`,
    start: s.start,
    end: s.end,
    backgroundColor: "#475569",
    borderColor: "#334155",
    extendedProps: { type: "busy", source: s.source },
  }));
}

export function findFreeDays(
  fromISO: string,
  horizonDays: number,
  busy: BusySlot[],
  existingTasks: DailyTask[]
): string[] {
  const busyDays = new Set(
    busy.map((b) => {
      try {
        return format(parseISO(b.start), "yyyy-MM-dd");
      } catch {
        return "";
      }
    })
  );
  const taskLoad = new Map<string, number>();
  for (const t of existingTasks) {
    if (t.completed) continue;
    taskLoad.set(t.scheduled_date, (taskLoad.get(t.scheduled_date) ?? 0) + 1);
  }

  const free: string[] = [];
  let cursor = parseISO(fromISO);
  for (let i = 0; i < horizonDays; i++) {
    const iso = format(cursor, "yyyy-MM-dd");
    const day = cursor.getDay();
    const weekend = day === 0 || day === 6;
    const load = taskLoad.get(iso) ?? 0;
    if (!weekend && !busyDays.has(iso) && load < 3) {
      free.push(iso);
    }
    cursor = addDays(cursor, 1);
  }
  return free;
}

export function suggestSlotForTask(
  task: DailyTask,
  freeDays: string[]
): string | null {
  return freeDays.find((d) => d >= task.scheduled_date) ?? freeDays[0] ?? null;
}
