/**
 * Export Goal Garden tasks as standard .ics for Outlook, Apple Calendar, Google Calendar.
 * This is the reliable, non-spammy way to put tasks on a desktop calendar without OAuth.
 */
import type { GoalWithTree } from "./types";
import { format, parseISO, addHours } from "date-fns";

function icsEscape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // ICS lines should be <= 75 octets; simple fold for long summaries
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

function uidFor(taskId: string) {
  return `${taskId}@goal-garden.local`;
}

function dateToIcsDate(isoDate: string) {
  // All-day event: VALUE=DATE:YYYYMMDD
  return isoDate.replace(/-/g, "");
}

function stampNow() {
  return format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
}

export type IcsExportOptions = {
  /** Include completed tasks (default false) */
  includeCompleted?: boolean;
  /** Only from this date (YYYY-MM-DD) */
  fromDate?: string;
  calendarName?: string;
};

/** Build a full VCALENDAR string from goals */
export function buildGoalsIcs(
  goals: GoalWithTree[],
  options: IcsExportOptions = {}
): string {
  const {
    includeCompleted = false,
    fromDate,
    calendarName = "Goal Garden",
  } = options;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Goal Garden//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(calendarName)}`,
    "X-WR-TIMEZONE:UTC",
  ];

  for (const goal of goals) {
    if (goal.archived) continue;
    for (const m of goal.milestones) {
      for (const t of m.daily_tasks) {
        if (!includeCompleted && t.completed) continue;
        if (fromDate && t.scheduled_date < fromDate) continue;

        const day = dateToIcsDate(t.scheduled_date);
        // all-day: DTEND is exclusive next day
        let endDay: string;
        try {
          endDay = format(addHours(parseISO(t.scheduled_date), 24), "yyyyMMdd");
        } catch {
          endDay = day;
        }

        const summary = t.completed
          ? `✓ ${t.title}`
          : t.title;
        const description = [
          `Goal: ${goal.title}`,
          `Milestone: ${m.title}`,
          t.notes ? `Notes: ${t.notes}` : "",
          "From Goal Garden — gentle task, not a hard meeting.",
        ]
          .filter(Boolean)
          .join("\\n");

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${uidFor(t.id)}`);
        lines.push(`DTSTAMP:${stampNow()}`);
        lines.push(`DTSTART;VALUE=DATE:${day}`);
        lines.push(`DTEND;VALUE=DATE:${endDay}`);
        lines.push(foldLine(`SUMMARY:${icsEscape(summary)}`));
        lines.push(foldLine(`DESCRIPTION:${icsEscape(description.replace(/\\n/g, "\n"))}`));
        lines.push(`CATEGORIES:GoalGarden,${icsEscape(goal.category || "goal")}`);
        lines.push("STATUS:CONFIRMED");
        lines.push("TRANSP:TRANSPARENT"); // free — doesn't block as "busy" spam
        lines.push("END:VEVENT");
      }
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcsFile(ics: string, filename = "goal-garden.ics") {
  const blob = new Blob([ics], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Google Calendar "create event" for a single all-day task (opens in browser). */
export function googleCalendarUrl(opts: {
  title: string;
  date: string; // YYYY-MM-DD
  details?: string;
}): string {
  const start = opts.date.replace(/-/g, "");
  let end: string;
  try {
    end = format(addHours(parseISO(opts.date), 24), "yyyyMMdd");
  } catch {
    end = start;
  }
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${start}/${end}`,
    details: opts.details || "From Goal Garden",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function countExportableTasks(
  goals: GoalWithTree[],
  includeCompleted = false
): number {
  return goals
    .filter((g) => !g.archived)
    .flatMap((g) => g.milestones.flatMap((m) => m.daily_tasks))
    .filter((t) => includeCompleted || !t.completed).length;
}
