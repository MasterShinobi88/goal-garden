"use client";

/**
 * Import / export Goal Garden data (goals, optional food log, prefs).
 */
import type { DailyTask, GoalWithTree, Milestone, UserPreferences } from "./types";
import { loadGoals, saveGoals, loadPrefs, savePrefs, getSession } from "./local-store";
import { uid } from "./utils";

export const EXPORT_VERSION = 1;

export type WorkspaceExport = {
  app: "goal-garden";
  version: number;
  exportedAt: string;
  goals: GoalWithTree[];
  prefs?: UserPreferences;
  foodLog?: Record<string, unknown[]>;
  journal?: unknown[];
  finance?: unknown;
};

export type ImportMode = "merge" | "replace";

export type ImportResult = {
  ok: boolean;
  goalsImported: number;
  goalsSkipped: number;
  /** Calendar events converted to tasks (ICS import) */
  eventsImported?: number;
  message: string;
  errors: string[];
};

export type ParsedIcsEvent = {
  uid: string;
  summary: string;
  description?: string;
  /** YYYY-MM-DD */
  date: string;
  allDay: boolean;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function normalizeTask(
  raw: unknown,
  milestoneId: string,
  index: number
): DailyTask | null {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title).trim();
  if (!title) return null;
  const scheduled =
    asString(raw.scheduled_date || raw.scheduledDate || raw.date).slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  return {
    id: asString(raw.id) || uid(),
    milestone_id: asString(raw.milestone_id || raw.milestoneId) || milestoneId,
    title,
    scheduled_date: scheduled,
    completed: asBool(raw.completed),
    notes: raw.notes != null ? asString(raw.notes) : null,
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : index,
    created_at: asString(raw.created_at) || new Date().toISOString(),
  };
}

function normalizeMilestone(
  raw: unknown,
  goalId: string,
  index: number
): (Milestone & { daily_tasks: DailyTask[] }) | null {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title).trim();
  if (!title) return null;
  const mid = asString(raw.id) || uid();
  const tasksRaw = Array.isArray(raw.daily_tasks)
    ? raw.daily_tasks
    : Array.isArray(raw.tasks)
      ? raw.tasks
      : [];
  const daily_tasks = tasksRaw
    .map((t, i) => normalizeTask(t, mid, i))
    .filter(Boolean) as DailyTask[];

  return {
    id: mid,
    goal_id: asString(raw.goal_id || raw.goalId) || goalId,
    title,
    target_date:
      asString(raw.target_date || raw.targetDate || raw.deadline).slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    completed: asBool(raw.completed),
    sort_order: typeof raw.sort_order === "number" ? raw.sort_order : index,
    created_at: asString(raw.created_at) || new Date().toISOString(),
    daily_tasks,
  };
}

export function normalizeGoal(
  raw: unknown,
  userId: string
): GoalWithTree | null {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title).trim();
  if (!title) return null;

  const goalId = asString(raw.id) || uid();
  const msRaw = Array.isArray(raw.milestones) ? raw.milestones : [];
  const milestones = msRaw
    .map((m, i) => normalizeMilestone(m, goalId, i))
    .filter(Boolean) as (Milestone & { daily_tasks: DailyTask[] })[];

  // Flat tasks without milestones → one milestone bucket
  if (!milestones.length && Array.isArray(raw.tasks)) {
    const mid = uid();
    const daily_tasks = (raw.tasks as unknown[])
      .map((t, i) => normalizeTask(t, mid, i))
      .filter(Boolean) as DailyTask[];
    if (daily_tasks.length) {
      milestones.push({
        id: mid,
        goal_id: goalId,
        title: "Imported tasks",
        target_date:
          asString(raw.deadline).slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
        completed: false,
        sort_order: 0,
        created_at: new Date().toISOString(),
        daily_tasks,
      });
    }
  }

  return {
    id: goalId,
    user_id: asString(raw.user_id || raw.userId) || userId,
    title,
    description: raw.description != null ? asString(raw.description) : null,
    deadline:
      asString(raw.deadline).slice(0, 10) ||
      new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10),
    success_metrics:
      raw.success_metrics != null
        ? asString(raw.success_metrics)
        : raw.successMetrics != null
          ? asString(raw.successMetrics)
          : null,
    archived: asBool(raw.archived),
    category:
      raw.category === "weight_loss" ? "weight_loss" : "general",
    health_profile: (raw.health_profile as GoalWithTree["health_profile"]) ?? null,
    health_plan: (raw.health_plan as GoalWithTree["health_plan"]) ?? null,
    created_at: asString(raw.created_at) || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    milestones,
  };
}

/** Build a full workspace export */
export function buildExport(options?: {
  includePrefs?: boolean;
  includeFoodLog?: boolean;
}): WorkspaceExport {
  const payload: WorkspaceExport = {
    app: "goal-garden",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    goals: loadGoals(),
  };
  if (options?.includePrefs !== false) {
    payload.prefs = loadPrefs();
  }
  if (options?.includeFoodLog) {
    try {
      const raw = localStorage.getItem("goal-garden:food-log");
      if (raw) payload.foodLog = JSON.parse(raw) as Record<string, unknown[]>;
    } catch {
      /* ignore */
    }
  }
  try {
    const raw = localStorage.getItem("goal-garden:journal");
    if (raw) payload.journal = JSON.parse(raw) as unknown[];
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem("goal-garden:finance");
    if (raw) payload.finance = JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return payload;
}

export function downloadExport(filename?: string) {
  const data = buildExport({ includePrefs: true, includeFoodLog: true });
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `goal-garden-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function extractGoalsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) return [];
  if (Array.isArray(parsed.goals)) return parsed.goals;
  // single goal object
  if (parsed.title) return [parsed];
  return [];
}

/**
 * Import from Goal Garden JSON (full backup or goals array / single goal).
 */
export function importFromJson(
  text: string,
  mode: ImportMode = "merge"
): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: 0,
      message: "Invalid JSON — could not parse file.",
      errors: ["JSON parse error"],
    };
  }

  const session = getSession();
  const userId = session?.id || "imported-user";
  const rawGoals = extractGoalsArray(parsed);
  if (!rawGoals.length) {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: 0,
      message: "No goals found. Expect a backup file or a goals array.",
      errors: ["Empty goals"],
    };
  }

  const imported: GoalWithTree[] = [];
  let skipped = 0;
  for (const raw of rawGoals) {
    const g = normalizeGoal(raw, userId);
    if (!g) {
      skipped++;
      errors.push("Skipped an entry without a title");
      continue;
    }
    // Fresh IDs on merge collision avoided by regenerating if replace? keep ids for merge update
    imported.push(g);
  }

  if (!imported.length) {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: skipped,
      message: "Nothing valid to import.",
      errors,
    };
  }

  if (mode === "replace") {
    // New ids optional — keep structure as-is for true restore
    saveGoals(imported);
  } else {
    const existing = loadGoals();
    const byId = new Map(existing.map((g) => [g.id, g]));
    for (const g of imported) {
      if (byId.has(g.id)) {
        // Same id → treat as update; if user re-imports same file, update
        byId.set(g.id, g);
      } else {
        // Ensure unique id if title collision with different id is fine
        byId.set(g.id, g);
      }
    }
    saveGoals(Array.from(byId.values()));
  }

  // Optional prefs / food from full backup
  if (isRecord(parsed) && parsed.app === "goal-garden") {
    if (isRecord(parsed.prefs) && mode === "replace") {
      savePrefs({ ...loadPrefs(), ...(parsed.prefs as UserPreferences) });
    }
    if (parsed.foodLog && mode === "replace") {
      try {
        localStorage.setItem(
          "goal-garden:food-log",
          JSON.stringify(parsed.foodLog)
        );
        window.dispatchEvent(new CustomEvent("goal-garden:food-log"));
      } catch {
        errors.push("Food log could not be restored");
      }
    }
    if (Array.isArray(parsed.journal) && mode === "replace") {
      try {
        localStorage.setItem(
          "goal-garden:journal",
          JSON.stringify(parsed.journal)
        );
        window.dispatchEvent(new CustomEvent("goal-garden:journal"));
      } catch {
        errors.push("Journal could not be restored");
      }
    }
    if (parsed.finance && mode === "replace") {
      try {
        localStorage.setItem(
          "goal-garden:finance",
          JSON.stringify(parsed.finance)
        );
        window.dispatchEvent(new CustomEvent("goal-garden:finance"));
      } catch {
        errors.push("Finance could not be restored");
      }
    }
  }

  return {
    ok: true,
    goalsImported: imported.length,
    goalsSkipped: skipped,
    message:
      mode === "replace"
        ? `Replaced workspace with ${imported.length} goal(s).`
        : `Merged ${imported.length} goal(s) into your garden.`,
    errors,
  };
}

/**
 * CSV import: title,deadline,description,success_metrics
 * Header row optional.
 */
export function importFromCsv(
  text: string,
  mode: ImportMode = "merge"
): ImportResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: 0,
      message: "CSV is empty.",
      errors: ["Empty CSV"],
    };
  }

  let start = 0;
  const header = lines[0].toLowerCase();
  if (header.includes("title") && header.includes(",")) {
    start = 1;
  }

  const session = getSession();
  const userId = session?.id || "imported-user";
  const goals: GoalWithTree[] = [];
  const errors: string[] = [];

  for (let i = start; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const title = (cols[0] || "").trim();
    if (!title) {
      errors.push(`Line ${i + 1}: missing title`);
      continue;
    }
    const deadline =
      (cols[1] || "").trim().slice(0, 10) ||
      new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10);
    const description = (cols[2] || "").trim() || null;
    const success_metrics = (cols[3] || "").trim() || null;

    goals.push({
      id: uid(),
      user_id: userId,
      title,
      description,
      deadline,
      success_metrics,
      archived: false,
      category: "general",
      health_profile: null,
      health_plan: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones: [],
    });
  }

  if (!goals.length) {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: errors.length,
      message: "No valid CSV rows.",
      errors,
    };
  }

  if (mode === "replace") {
    saveGoals(goals);
  } else {
    saveGoals([...goals, ...loadGoals()]);
  }

  return {
    ok: true,
    goalsImported: goals.length,
    goalsSkipped: errors.length,
    message: `Imported ${goals.length} goal(s) from CSV.`,
    errors,
  };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/** Unfold ICS content lines (continuation lines start with space/tab) */
function unfoldIcs(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function icsUnescape(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * Parse DTSTART-style values into YYYY-MM-DD.
 * Supports: 20260115, 20260115T090000, 20260115T090000Z, with TZID params ignored.
 */
function parseIcsDate(raw: string): { date: string; allDay: boolean } | null {
  const v = raw.trim();
  // VALUE=DATE:20260115 or plain 20260115
  const dateOnly = v.match(/(?:VALUE=DATE:)?(\d{8})$/i) || v.match(/^(\d{8})$/);
  if (dateOnly && !v.includes("T")) {
    const d = dateOnly[1];
    return {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      allDay: true,
    };
  }
  const dateTime = v.match(/(\d{8})T(\d{6})Z?/i);
  if (dateTime) {
    const d = dateTime[1];
    return {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      allDay: false,
    };
  }
  // ISO-ish fallback
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    return { date: v.slice(0, 10), allDay: !v.includes("T") };
  }
  return null;
}

/** Extract VEVENT blocks from an .ics calendar export */
export function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const text = unfoldIcs(icsText);
  if (!/BEGIN:VCALENDAR/i.test(text) && !/BEGIN:VEVENT/i.test(text)) {
    return [];
  }

  const events: ParsedIcsEvent[] = [];
  const blocks = text.split(/BEGIN:VEVENT/i).slice(1);

  for (const block of blocks) {
    const body = block.split(/END:VEVENT/i)[0] || "";
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

    let eventUid = "";
    let summary = "";
    let description = "";
    let dateRaw = "";

    for (const line of lines) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      const keyPart = line.slice(0, colon);
      const value = line.slice(colon + 1);
      const key = keyPart.split(";")[0].toUpperCase();

      if (key === "UID") eventUid = value;
      else if (key === "SUMMARY") summary = icsUnescape(value);
      else if (key === "DESCRIPTION") description = icsUnescape(value);
      if (keyPart.toUpperCase().startsWith("DTSTART")) {
        dateRaw = value;
      }
    }

    const parsedDate = parseIcsDate(dateRaw);
    if (!summary.trim() || !parsedDate) continue;

    events.push({
      uid: eventUid || uid(),
      summary: summary.trim(),
      description: description.trim() || undefined,
      date: parsedDate.date,
      allDay: parsedDate.allDay,
    });
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/**
 * Import Google / Outlook / Apple .ics export as a Goal Garden goal with tasks.
 * Each event becomes a daily task on its date; milestones group by week.
 */
export function importFromIcs(
  text: string,
  mode: ImportMode = "merge"
): ImportResult {
  const events = parseIcsEvents(text);
  const errors: string[] = [];

  if (!events.length) {
    return {
      ok: false,
      goalsImported: 0,
      goalsSkipped: 0,
      eventsImported: 0,
      message:
        "No calendar events found. Export an .ics from Google, Outlook, or Apple and try again.",
      errors: ["No VEVENT entries"],
    };
  }

  // Cap to avoid huge imports flooding the UI
  const MAX = 400;
  const slice = events.slice(0, MAX);
  if (events.length > MAX) {
    errors.push(`Only first ${MAX} of ${events.length} events imported`);
  }

  const session = getSession();
  const userId = session?.id || "imported-user";
  const goalId = uid();
  const now = new Date().toISOString();

  // Group events into weekly milestones
  const byWeek = new Map<string, ParsedIcsEvent[]>();
  for (const ev of slice) {
    const d = new Date(ev.date + "T12:00:00");
    // Monday-based week key
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(ev);
  }

  const weekKeys = Array.from(byWeek.keys()).sort();
  const milestones: (Milestone & { daily_tasks: DailyTask[] })[] =
    weekKeys.map((weekStart, wi) => {
      const mid = uid();
      const weekEvents = byWeek.get(weekStart) || [];
      const end = new Date(weekStart + "T12:00:00");
      end.setDate(end.getDate() + 6);
      const target = end.toISOString().slice(0, 10);

      const daily_tasks: DailyTask[] = weekEvents.map((ev, ti) => ({
        id: uid(),
        milestone_id: mid,
        title: ev.summary,
        scheduled_date: ev.date,
        completed: false,
        notes: ev.description
          ? ev.description.slice(0, 500)
          : ev.allDay
            ? "Imported all-day event"
            : "Imported calendar event",
        sort_order: ti,
        created_at: now,
      }));

      return {
        id: mid,
        goal_id: goalId,
        title: `Week of ${weekStart}`,
        target_date: target,
        completed: false,
        sort_order: wi,
        created_at: now,
        daily_tasks,
      };
    });

  const lastDate = slice[slice.length - 1]?.date || now.slice(0, 10);
  const firstDate = slice[0]?.date || now.slice(0, 10);

  const goal: GoalWithTree = {
    id: goalId,
    user_id: userId,
    title: "Imported calendar",
    description: `Imported ${slice.length} event(s) from an .ics file (${firstDate} → ${lastDate}). Edit titles freely — this is a one-time import, not a live link.`,
    deadline: lastDate,
    success_metrics: null,
    archived: false,
    category: "general",
    health_profile: null,
    health_plan: null,
    created_at: now,
    updated_at: now,
    milestones,
  };

  if (mode === "replace") {
    saveGoals([goal]);
  } else {
    // Avoid stacking identical "Imported calendar" spam: merge events into new goal always as new goal
    saveGoals([goal, ...loadGoals()]);
  }

  return {
    ok: true,
    goalsImported: 1,
    goalsSkipped: 0,
    eventsImported: slice.length,
    message: `Imported ${slice.length} calendar event(s) as goal “Imported calendar” with ${milestones.length} weekly milestone(s).`,
    errors,
  };
}

export function detectImportFormat(
  text: string
): "json" | "csv" | "ics" | "unknown" {
  const t = text.trim();
  if (!t) return "unknown";
  if (/BEGIN:VCALENDAR/i.test(t) || /BEGIN:VEVENT/i.test(t)) return "ics";
  if (t.startsWith("{") || t.startsWith("[")) return "json";
  if (t.includes(",") && t.split("\n").length >= 1) return "csv";
  return "unknown";
}

export function importAuto(
  text: string,
  mode: ImportMode
): ImportResult {
  const format = detectImportFormat(text);
  if (format === "ics") return importFromIcs(text, mode);
  if (format === "json") return importFromJson(text, mode);
  if (format === "csv") return importFromCsv(text, mode);
  return {
    ok: false,
    goalsImported: 0,
    goalsSkipped: 0,
    message:
      "Unrecognized format. Use .ics calendar, Goal Garden JSON backup, or CSV.",
    errors: ["Unknown format"],
  };
}
