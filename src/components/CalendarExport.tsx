"use client";

import { useRef, useState } from "react";
import {
  CalendarPlus,
  Download,
  ExternalLink,
  Info,
  Upload,
} from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import {
  buildGoalsIcs,
  countExportableTasks,
  downloadIcsFile,
  googleCalendarUrl,
} from "@/lib/calendar-ics";
import { importFromIcs } from "@/lib/import-export";
import { todayISO } from "@/lib/utils";

export function CalendarExport({ goals }: { goals: GoalWithTree[] }) {
  const [includeDone, setIncludeDone] = useState(false);
  const [fromToday, setFromToday] = useState(true);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const icsRef = useRef<HTMLInputElement>(null);
  const count = countExportableTasks(goals, includeDone);

  function exportIcs() {
    const ics = buildGoalsIcs(goals, {
      includeCompleted: includeDone,
      fromDate: fromToday ? todayISO() : undefined,
      calendarName: "Goal Garden",
    });
    downloadIcsFile(ics, `goal-garden-${todayISO()}.ics`);
  }

  // First upcoming open task → “add one event to Google”
  const nextTask = goals
    .filter((g) => !g.archived)
    .flatMap((g) =>
      g.milestones.flatMap((m) =>
        m.daily_tasks
          .filter((t) => !t.completed && t.scheduled_date >= todayISO())
          .map((t) => ({ ...t, goalTitle: g.title }))
      )
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-start gap-2">
        <CalendarPlus className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div>
          <h2 className="text-sm font-semibold">Sync to desktop calendar</h2>
          <p className="mt-1 text-xs text-muted">
            Export a standard <strong className="text-foreground">.ics</strong>{" "}
            file. Windows Calendar, Outlook, Apple Calendar, and Google Calendar
            all import it. Tasks are marked free time so they won’t spam you as
            “busy” meetings.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={fromToday}
            onChange={(e) => setFromToday(e.target.checked)}
          />
          From today forward only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-emerald-500"
            checked={includeDone}
            onChange={(e) => setIncludeDone(e.target.checked)}
          />
          Include completed tasks
        </label>
      </div>

      <button
        type="button"
        className="btn-primary w-full text-sm"
        disabled={count === 0}
        onClick={exportIcs}
      >
        <Download className="h-4 w-4" />
        Download .ics ({count} events)
      </button>

      {nextTask && (
        <a
          className="btn-ghost flex w-full text-sm"
          href={googleCalendarUrl({
            title: nextTask.title,
            date: nextTask.scheduled_date,
            details: `Goal: ${nextTask.goalTitle}\nFrom Goal Garden`,
          })}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Add next task to Google Calendar
        </a>
      )}

      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-foreground">
          Import calendar into Goal Garden
        </p>
        <input
          ref={icsRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              const res = importFromIcs(text, "merge");
              setImportMsg(res.message);
              if (res.ok) {
                window.dispatchEvent(new CustomEvent("goal-garden:update"));
              }
            } catch {
              setImportMsg("Could not read that calendar file.");
            }
            if (icsRef.current) icsRef.current.value = "";
          }}
        />
        <button
          type="button"
          className="btn-ghost w-full text-sm"
          onClick={() => icsRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Import .ics (Google / Outlook / Apple)
        </button>
        {importMsg && (
          <p className="mt-2 text-[11px] text-muted">{importMsg}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-black/20 p-3 text-[11px] leading-relaxed text-muted">
        <p className="mb-1.5 flex items-center gap-1 font-medium text-foreground">
          <Info className="h-3.5 w-3.5 text-accent" />
          How calendars work
        </p>
        <ol className="list-decimal space-y-1 pl-4">
          <li>
            <strong className="text-foreground">Out:</strong> Download .ics or
            use Auto-sync feed so desktop calendars show your tasks.
          </li>
          <li>
            <strong className="text-foreground">In:</strong> Export .ics from
            Google/Outlook/Apple and import here — events become tasks.
          </li>
          <li>
            Import is a snapshot (not live two-way). Re-import after big calendar
            changes if you need an update.
          </li>
        </ol>
      </div>
    </div>
  );
}
