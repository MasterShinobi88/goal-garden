"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  Plus,
  Search,
  Trash2,
  Pencil,
  X,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  createJournalEntry,
  deleteJournalEntry,
  journalStats,
  listJournalEntries,
  moodMeta,
  MOOD_OPTIONS,
  updateJournalEntry,
  type JournalEntry,
  type JournalMood,
} from "@/lib/journal";
import { formatDisplayDate, todayISO, cn } from "@/lib/utils";
import { useAuthUser, useGoals } from "@/hooks/useGoals";

const PROMPTS = [
  "What went well today, even a little?",
  "What am I grateful for right now?",
  "What drained my energy — and what restored it?",
  "One thing I’d tell tomorrow-me…",
  "How did my body feel today (energy, sleep, hunger)?",
  "What progress did I make on my goals, however small?",
];

export default function JournalPage() {
  const { user } = useAuthUser();
  const { active } = useGoals(user?.id);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, streak: 0 });
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form state
  const [date, setDate] = useState(todayISO());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    () => PROMPTS[new Date().getDay() % PROMPTS.length]
  );

  const refresh = useCallback(() => {
    setEntries(listJournalEntries());
    setStats(journalStats());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("goal-garden:journal", on);
    return () => window.removeEventListener("goal-garden:journal", on);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        (e.mood && e.mood.includes(q))
    );
  }, [entries, query]);

  function openNew() {
    setIsNew(true);
    setEditing(null);
    setDate(todayISO());
    setTitle("");
    setBody("");
    setMood(null);
    setGoalId(null);
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }

  function openEdit(entry: JournalEntry) {
    setIsNew(false);
    setEditing(entry);
    setDate(entry.date);
    setTitle(entry.title === "Untitled" ? "" : entry.title);
    setBody(entry.body);
    setMood(entry.mood);
    setGoalId(entry.goal_id);
  }

  function closeEditor() {
    setIsNew(false);
    setEditing(null);
  }

  function save() {
    if (isNew) {
      createJournalEntry({
        date,
        title,
        body,
        mood,
        goal_id: goalId,
      });
    } else if (editing) {
      updateJournalEntry(editing.id, {
        date,
        title,
        body,
        mood,
        goal_id: goalId,
      });
    }
    closeEditor();
    refresh();
  }

  function remove(id: string) {
    if (!confirm("Delete this journal entry?")) return;
    deleteJournalEntry(id);
    if (editing?.id === id) closeEditor();
    refresh();
  }

  const showEditor = isNew || editing;

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col gap-3 overflow-hidden animate-fade-up">
      <div className="shrink-0">
      <PageHeader
        eyebrow="Reflect"
        title="Journal"
        description="A private space for wins, hard days, and everything in between — no judgment."
        actions={
          <button type="button" className="btn-primary text-sm" onClick={openNew}>
            <Plus className="h-4 w-4" />
            New entry
          </button>
        }
      />
      </div>

      {/* Stats */}
      <div className="grid shrink-0 grid-cols-3 gap-3">
        <Stat label="Entries" value={String(stats.total)} />
        <Stat label="This month" value={String(stats.thisMonth)} />
        <Stat label="Day streak" value={`${stats.streak}d`} accent />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[1fr_280px]">
        {/* List */}
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              className="input-field pl-10"
              placeholder="Search entries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">
                {entries.length === 0 ? "Your journal is empty" : "No matches"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {entries.length === 0
                  ? "Capture how you feel after a workout, a tough day, or a small win. It compounds."
                  : "Try a different search."}
              </p>
              {entries.length === 0 && (
                <button
                  type="button"
                  className="btn-primary mt-5 text-sm"
                  onClick={openNew}
                >
                  <Plus className="h-4 w-4" />
                  Write first entry
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((entry, i) => {
                const m = moodMeta(entry.mood);
                const goal = active.find((g) => g.id === entry.goal_id);
                return (
                  <li
                    key={entry.id}
                    className="card card-interactive animate-fade-up cursor-pointer p-4"
                    style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                    onClick={() => openEdit(entry)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDisplayDate(entry.date)}
                          </span>
                          {m && (
                            <span className="rounded-full bg-white/5 px-2 py-0.5">
                              {m.emoji} {m.label}
                            </span>
                          )}
                          {goal && (
                            <span className="truncate text-accent/80">
                              · {goal.title}
                            </span>
                          )}
                        </div>
                        <h3 className="truncate font-semibold tracking-tight">
                          {entry.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">
                          {entry.body || "No body text"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(entry);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(entry.id);
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </div>

        {/* Side: prompt + tips */}
        <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <div className="card p-4">
            <p className="section-label mb-2">Today’s prompt</p>
            <p className="text-sm leading-relaxed text-foreground">{prompt}</p>
            <button
              type="button"
              className="btn-ghost mt-3 w-full text-xs"
              onClick={() => {
                openNew();
                setBody((b) => (b ? b : `${prompt}\n\n`));
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Write from this
            </button>
          </div>
          <div className="card p-4 text-xs leading-relaxed text-muted">
            <p className="mb-1 font-medium text-foreground">Private by design</p>
            Entries stay in this browser (local storage) in demo mode. Export a
            backup from Settings anytime.
          </div>
        </aside>
      </div>

      {/* Editor modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="absolute inset-0" onClick={closeEditor} aria-hidden />
          <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {isNew ? "New entry" : "Edit entry"}
                </h2>
                <p className="text-xs text-muted">Be honest — this is only for you.</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1 text-muted hover:bg-white/5"
                onClick={closeEditor}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Link to goal (optional)
                  </label>
                  <select
                    className="input-field"
                    value={goalId || ""}
                    onChange={(e) => setGoalId(e.target.value || null)}
                  >
                    <option value="">None</option>
                    {active.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted">Title</label>
                <input
                  className="input-field"
                  placeholder="A few words…"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted">Mood</label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setMood((cur) => (cur === m.id ? null : m.id))
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition",
                        mood === m.id
                          ? "border-accent/40 bg-accent/15 text-accent"
                          : "border-border text-muted hover:border-accent/25"
                      )}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted">Entry</label>
                <textarea
                  className="input-field min-h-[160px] resize-y leading-relaxed"
                  placeholder={prompt}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                {!isNew && editing && (
                  <button
                    type="button"
                    className="btn-ghost text-sm text-danger sm:mr-auto"
                    onClick={() => remove(editing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
                <button type="button" className="btn-ghost" onClick={closeEditor}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={save}
                  disabled={!body.trim() && !title.trim()}
                >
                  Save entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold tabular-nums",
          accent ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
