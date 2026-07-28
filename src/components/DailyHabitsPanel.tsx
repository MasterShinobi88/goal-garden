"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Moon,
  Plus,
  Sparkles,
  Sunrise,
} from "lucide-react";
import {
  PRIORITY_META,
  activeHabitsSorted,
  addHabit,
  habitDayStats,
  isHabitDone,
  moveHabit,
  setHabitPriority,
  toggleHabitDone,
  type Habit,
  type HabitDayStats,
  type HabitPriority,
} from "@/lib/habits";
import {
  formatCountdown,
  formatTime12,
  getSleepStatus,
  updateSleepLog,
  type SleepStatus,
} from "@/lib/sleep";
import { cn } from "@/lib/utils";

export function DailyHabitsPanel({ compact: _compact }: { compact?: boolean }) {
  const [stats, setStats] = useState<HabitDayStats | null>(null);
  const [sleep, setSleep] = useState<SleepStatus | null>(null);
  const [habitList, setHabitList] = useState<Habit[]>(() =>
    typeof window !== "undefined" ? activeHabitsSorted() : []
  );
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<HabitPriority>(1);
  const [bedDraft, setBedDraft] = useState("");
  const [wakeDraft, setWakeDraft] = useState("");
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setHabitList(activeHabitsSorted());
    setStats(habitDayStats());
    const s = getSleepStatus();
    setSleep(s);
    setBedDraft(s.log?.bed_time || s.schedule.target_bedtime);
    setWakeDraft(s.log?.wake_time || s.schedule.target_wake);
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("goal-garden:habits", on);
    window.addEventListener("goal-garden:sleep", on);
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => {
      window.removeEventListener("goal-garden:habits", on);
      window.removeEventListener("goal-garden:sleep", on);
      window.clearInterval(id);
    };
  }, [refresh, tick]);

  if (!stats || !sleep) return null;

  const schedule = sleep.schedule;

  function onToggle(id: string) {
    toggleHabitDone(id);
    refresh();
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit({ title: newTitle.trim(), priority: newPriority });
    setNewTitle("");
    setAdding(false);
    refresh();
  }

  function saveSleepTimes() {
    updateSleepLog({
      bed_time: bedDraft || null,
      wake_time: wakeDraft || null,
    });
    refresh();
  }

  const orderedHabits = habitList;

  return (
    <section className="grid gap-3 lg:grid-cols-[1.25fr_0.95fr]">
      {/* Left column: sortable habit list
          Do not nest overflow-y-auto + overscroll-contain here — without a max
          height the list traps the mouse wheel and the dashboard pane won't scroll
          until the pointer moves over Sleep / another non-trapping area. */}
      <div className="card flex flex-col p-0">
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Daily habits
            </p>
            <p className="mt-0.5 text-xs text-muted">
              ▲▼ reorder · P1/P2/P3 set importance
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums text-accent">
              {stats.completed}/{stats.total}
            </p>
            <p className="text-[10px] text-muted">
              {stats.streakDays > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-amber-300">
                  <Flame className="h-3 w-3" />
                  {stats.streakDays}d P1 streak
                </span>
              ) : (
                "P1 streak starts today"
              )}
            </p>
          </div>
        </div>

        <div className="border-b border-border/40 px-4 py-2">
          <div className="mb-1 flex justify-between text-[10px] text-muted">
            <span>
              Musts {stats.p1Done}/{stats.p1Total}
              {stats.mustsCleared ? " · cleared ✓" : " · do these first"}
            </span>
            <span>{stats.compoundScore} lifetime reps</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-accent transition-all"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 p-3">
          {orderedHabits.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted">
              No active habits — add a tiny one you can repeat daily.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {orderedHabits.map((h, index) => (
                <HabitRow
                  key={h.id}
                  habit={h}
                  index={index}
                  total={orderedHabits.length}
                  done={isHabitDone(h.id)}
                  onToggle={() => onToggle(h.id)}
                  onMove={(dir) => {
                    // Always refresh from storage after attempt
                    moveHabit(h.id, dir);
                    refresh();
                  }}
                  onPriority={(p) => {
                    setHabitPriority(h.id, p);
                    refresh();
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          {adding ? (
            <form onSubmit={onAdd} className="space-y-2">
              <input
                className="input-field py-2 text-sm"
                placeholder="e.g. Stretch 5 minutes"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-2">
                {([1, 2, 3] as HabitPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-[11px]",
                      newPriority === p
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted"
                    )}
                  >
                    {PRIORITY_META[p].short}
                  </button>
                ))}
                <button type="submit" className="btn-primary ml-auto text-xs">
                  Add
                </button>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => setAdding(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add habit
              </button>
              <Link
                href="/dashboard/habits"
                className="text-[11px] font-medium text-accent hover:underline"
              >
                Manage · sleep schedule →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sleep tracker */}
      <div className="card flex flex-col overflow-hidden p-0">
        <div className="border-b border-border/60 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
            <Moon className="h-3.5 w-3.5" />
            Sleep
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Schedule + log — rest is a P0 habit
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          {schedule.enabled && (
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase text-muted">
                    {sleep.inWindDown
                      ? "Wind-down now"
                      : sleep.minutesToBed < 0
                        ? "Past target bed"
                        : "Until bedtime"}
                  </p>
                  <p className="text-xl font-bold tabular-nums text-indigo-200">
                    {formatCountdown(sleep.minutesToBed)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <p className="flex items-center justify-end gap-1">
                    <Moon className="h-3 w-3" />
                    Bed {formatTime12(schedule.target_bedtime)}
                  </p>
                  <p className="mt-0.5 flex items-center justify-end gap-1">
                    <Sunrise className="h-3 w-3" />
                    Wake {formatTime12(schedule.target_wake)}
                  </p>
                  <p className="mt-0.5 text-indigo-200/90">
                    Target {schedule.target_hours}h
                  </p>
                </div>
              </div>
              {sleep.inWindDown && (
                <p className="mt-2 text-[11px] text-amber-200">
                  Wind-down window — dim lights, screens down, protect sleep.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-medium text-muted">
              Log last night / this morning
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-muted">
                  Bedtime
                </label>
                <input
                  type="time"
                  className="input-field py-2 text-sm"
                  value={bedDraft}
                  onChange={(e) => setBedDraft(e.target.value)}
                  onBlur={saveSleepTimes}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted">
                  Wake time
                </label>
                <input
                  type="time"
                  className="input-field py-2 text-sm"
                  value={wakeDraft}
                  onChange={(e) => setWakeDraft(e.target.value)}
                  onBlur={saveSleepTimes}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm">
                Slept{" "}
                <strong className="text-accent">
                  {sleep.hoursLastNight != null
                    ? `${sleep.hoursLastNight}h`
                    : "—"}
                </strong>
                {sleep.onTrackHours === true && (
                  <span className="ml-1 text-[11px] text-accent">on track</span>
                )}
                {sleep.onTrackHours === false && (
                  <span className="ml-1 text-[11px] text-warn">under target</span>
                )}
              </p>
              {sleep.sleepStreak > 0 && (
                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] text-indigo-200">
                  {sleep.sleepStreak}d sleep streak
                </span>
              )}
            </div>
            <div className="mt-2 flex gap-1">
              {([1, 2, 3, 4, 5] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  title={`Quality ${q}/5`}
                  onClick={() => {
                    updateSleepLog({ quality: q });
                    refresh();
                  }}
                  className={cn(
                    "h-7 flex-1 rounded-lg border text-[11px] font-medium transition",
                    sleep.log?.quality === q
                      ? "border-indigo-400/50 bg-indigo-500/20 text-indigo-200"
                      : "border-border text-muted hover:border-indigo-400/30"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted">Sleep quality 1–5</p>
          </div>

          {sleep.avgHours7d != null && (
            <p className="text-[11px] text-muted">
              7-day average:{" "}
              <span className="font-medium text-foreground">
                {sleep.avgHours7d}h
              </span>
            </p>
          )}

          <Link
            href="/dashboard/habits"
            className="mt-auto text-[11px] font-medium text-accent hover:underline"
          >
            Edit sleep schedule →
          </Link>
        </div>
      </div>
    </section>
  );
}

function HabitRow({
  habit,
  index,
  total,
  done,
  onToggle,
  onMove,
  onPriority,
}: {
  habit: Habit;
  index: number;
  total: number;
  done: boolean;
  onToggle: () => void;
  onMove: (dir: "up" | "down") => void;
  onPriority: (p: HabitPriority) => void;
}) {
  const canUp = index > 0;
  const canDown = index < total - 1;
  const pMeta = PRIORITY_META[habit.priority];

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-xl border px-2 py-2 transition",
        done
          ? "border-accent/20 bg-accent/5 opacity-80"
          : habit.priority === 1
            ? "border-rose-400/25 bg-rose-500/5"
            : "border-border bg-black/20"
      )}
    >
      {/* Sort controls — left column, always visible & tappable */}
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          disabled={!canUp}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
            canUp
              ? "border-border bg-black/40 text-foreground hover:border-accent hover:bg-accent/15 hover:text-accent"
              : "cursor-not-allowed border-border/40 text-muted/30"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canUp) onMove("up");
          }}
          aria-label="Move up"
          title="Move up in list"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canDown}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
            canDown
              ? "border-border bg-black/40 text-foreground hover:border-accent hover:bg-accent/15 hover:text-accent"
              : "cursor-not-allowed border-border/40 text-muted/30"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canDown) onMove("down");
          }}
          aria-label="Move down"
          title="Move down in list"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
          done
            ? "border-accent bg-accent text-[#042f1a]"
            : "border-border hover:border-accent/50"
        )}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
      >
        {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold",
              habit.priority === 1 && "bg-rose-500/20 text-rose-300",
              habit.priority === 2 && "bg-amber-500/20 text-amber-300",
              habit.priority === 3 && "bg-sky-500/20 text-sky-300"
            )}
          >
            {pMeta.short}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm leading-snug",
                done && "text-muted line-through"
              )}
            >
              {habit.title}
            </p>
            {habit.notes && (
              <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
                {habit.notes}
              </p>
            )}
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-muted/70">
            #{index + 1}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1 pl-0 sm:pl-7">
          {([1, 2, 3] as HabitPriority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPriority(p);
              }}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-semibold transition",
                habit.priority === p
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border/60 text-muted hover:border-border hover:text-foreground"
              )}
              title={`Set ${PRIORITY_META[p].label}`}
            >
              {PRIORITY_META[p].short}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}
