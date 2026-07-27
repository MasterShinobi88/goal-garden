"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Moon,
  Plus,
  Trash2,
  Flame,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  PRIORITY_META,
  addHabit,
  deleteHabit,
  habitDayStats,
  listHabits,
  moveHabit,
  setHabitPriority,
  toggleHabitDone,
  updateHabit,
  isHabitDone,
  type Habit,
  type HabitPriority,
} from "@/lib/habits";
import {
  DEFAULT_SLEEP_SCHEDULE,
  formatTime12,
  getSleepSchedule,
  getSleepStatus,
  saveSleepSchedule,
  updateSleepLog,
  type SleepSchedule,
} from "@/lib/sleep";
import { cn } from "@/lib/utils";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState(() =>
    typeof window !== "undefined"
      ? habitDayStats()
      : {
          total: 0,
          completed: 0,
          p1Total: 0,
          p1Done: 0,
          pct: 0,
          mustsCleared: false,
          compoundScore: 0,
          streakDays: 0,
        }
  );
  const [schedule, setSchedule] = useState<SleepSchedule>(DEFAULT_SLEEP_SCHEDULE);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<HabitPriority>(1);
  const [bed, setBed] = useState("22:30");
  const [wake, setWake] = useState("06:30");

  const refresh = useCallback(() => {
    setHabits(listHabits());
    setStats(habitDayStats());
    const s = getSleepSchedule();
    setSchedule(s);
    setBed(s.target_bedtime);
    setWake(s.target_wake);
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("goal-garden:habits", on);
    window.addEventListener("goal-garden:sleep", on);
    return () => {
      window.removeEventListener("goal-garden:habits", on);
      window.removeEventListener("goal-garden:sleep", on);
    };
  }, [refresh]);

  const sleepStatus = typeof window !== "undefined" ? getSleepStatus() : null;

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col overflow-hidden animate-fade-up">
      <div className="shrink-0">
        <PageHeader
          eyebrow="Compound"
          title="Habits & sleep"
          description="Tiny daily reps with priorities — P1 musts first. Use ▲▼ to sort within each priority. Sleep schedule protects the foundation."
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-4">
        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Today"
            value={`${stats.completed}/${stats.total}`}
            sub={`${stats.pct}%`}
          />
          <Stat
            label="P1 musts"
            value={`${stats.p1Done}/${stats.p1Total}`}
            sub={stats.mustsCleared ? "cleared" : "do first"}
            accent
          />
          <Stat
            label="P1 streak"
            value={`${stats.streakDays}d`}
            sub="all musts"
          />
          <Stat
            label="Lifetime"
            value={String(stats.compoundScore)}
            sub="reps forever"
          />
        </div>

        <p className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-xs text-muted">
          <Sparkles className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-accent" />
          <strong className="text-foreground">Compound rule:</strong> finish{" "}
          <strong className="text-rose-300">P1</strong> before lower priorities.
          Missing a day doesn’t erase progress — restart at the next P1.
        </p>

        {/* Add habit */}
        <section className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold">Add a tiny habit</h2>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              addHabit({ title: title.trim(), priority });
              setTitle("");
              refresh();
            }}
          >
            <input
              className="input-field flex-1"
              placeholder="e.g. 5 push-ups after coffee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <select
              className="input-field sm:w-36"
              value={priority}
              onChange={(e) =>
                setPriority(Number(e.target.value) as HabitPriority)
              }
            >
              <option value={1}>P1 Must</option>
              <option value={2}>P2 Should</option>
              <option value={3}>P3 Boost</option>
            </select>
            <button type="submit" className="btn-primary shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </button>
          </form>
        </section>

        {/* Habit list by priority */}
        <section className="card space-y-4 p-4">
          <div>
            <h2 className="text-sm font-semibold">Your list (sort order)</h2>
            <p className="mt-0.5 text-[11px] text-muted">
              Use <strong className="text-foreground">▲ ▼</strong> to reorder
              the full list. P1 / P2 / P3 marks importance (does not lock
              position).
            </p>
          </div>
          {(() => {
            const active = habits
              .filter((h) => h.active)
              .sort((a, b) => a.sort_order - b.sort_order);
            if (active.length === 0) {
              return (
                <p className="text-[11px] text-muted/70">No habits yet</p>
              );
            }
            return (
              <ul className="space-y-1.5">
                {active.map((h, index) => {
                  const done = isHabitDone(h.id);
                  const canUp = index > 0;
                  const canDown = index < active.length - 1;
                  return (
                    <li
                      key={h.id}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2",
                        done
                          ? "border-accent/20 bg-accent/5"
                          : "border-border bg-black/20"
                      )}
                    >
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          disabled={!canUp}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border",
                            canUp
                              ? "border-border bg-black/40 text-foreground hover:border-accent hover:bg-accent/15 hover:text-accent"
                              : "cursor-not-allowed border-border/40 text-muted/30"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (moveHabit(h.id, "up")) refresh();
                          }}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!canDown}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border",
                            canDown
                              ? "border-border bg-black/40 text-foreground hover:border-accent hover:bg-accent/15 hover:text-accent"
                              : "cursor-not-allowed border-border/40 text-muted/30"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (moveHabit(h.id, "down")) refresh();
                          }}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          toggleHabitDone(h.id);
                          refresh();
                        }}
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                          done
                            ? "border-accent bg-accent text-[#042f1a]"
                            : "border-border"
                        )}
                      >
                        {done && (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <input
                          className="w-full bg-transparent text-sm font-medium outline-none"
                          value={h.title}
                          onChange={(e) =>
                            updateHabit(h.id, { title: e.target.value })
                          }
                          onBlur={refresh}
                        />
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <span className="mr-1 text-[10px] text-muted">
                            Priority:
                          </span>
                          {([1, 2, 3] as HabitPriority[]).map((pr) => (
                            <button
                              key={pr}
                              type="button"
                              onClick={() => {
                                setHabitPriority(h.id, pr);
                                refresh();
                              }}
                              className={cn(
                                "rounded-md border px-2 py-0.5 text-[10px] font-semibold transition",
                                h.priority === pr
                                  ? "border-accent/40 bg-accent/15 text-accent"
                                  : "border-border text-muted hover:text-foreground"
                              )}
                            >
                              {PRIORITY_META[pr].short}
                            </button>
                          ))}
                          <span className="ml-auto text-[10px] tabular-nums text-muted/70">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-1 text-muted hover:text-danger"
                        onClick={() => {
                          if (confirm("Delete this habit?")) {
                            deleteHabit(h.id);
                            refresh();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </section>

        {/* Sleep schedule */}
        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Moon className="h-4 w-4 text-indigo-300" />
              Sleep schedule
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="accent-indigo-400"
                checked={schedule.enabled}
                onChange={(e) => {
                  saveSleepSchedule({ enabled: e.target.checked });
                  refresh();
                }}
              />
              Enabled
            </label>
          </div>
          <p className="text-xs text-muted">
            Set a consistent bed and wake time. The dashboard counts down to
            bedtime and tracks hours slept.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-muted">
                Target bed
              </label>
              <input
                type="time"
                className="input-field"
                value={bed}
                onChange={(e) => setBed(e.target.value)}
                onBlur={() => {
                  saveSleepSchedule({ target_bedtime: bed });
                  refresh();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">
                Target wake
              </label>
              <input
                type="time"
                className="input-field"
                value={wake}
                onChange={(e) => setWake(e.target.value)}
                onBlur={() => {
                  saveSleepSchedule({ target_wake: wake });
                  refresh();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">
                Target hours
              </label>
              <input
                type="number"
                min={4}
                max={12}
                step={0.5}
                className="input-field"
                value={schedule.target_hours}
                onChange={(e) => {
                  saveSleepSchedule({
                    target_hours: parseFloat(e.target.value) || 8,
                  });
                  refresh();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">
                Wind-down (min before bed)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                className="input-field"
                value={schedule.wind_down_minutes}
                onChange={(e) => {
                  saveSleepSchedule({
                    wind_down_minutes: parseInt(e.target.value, 10) || 30,
                  });
                  refresh();
                }}
              />
            </div>
          </div>
          {sleepStatus && (
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs text-muted">
              Schedule: bed {formatTime12(schedule.target_bedtime)} · wake{" "}
              {formatTime12(schedule.target_wake)} ·{" "}
              {sleepStatus.sleepStreak > 0 && (
                <span className="text-indigo-200">
                  <Flame className="inline h-3 w-3" /> {sleepStatus.sleepStreak}
                  d on-track streak
                </span>
              )}
              {sleepStatus.avgHours7d != null && (
                <span> · 7d avg {sleepStatus.avgHours7d}h</span>
              )}
            </div>
          )}
          <button
            type="button"
            className="btn-ghost text-xs"
            onClick={() => {
              updateSleepLog({
                bed_time: schedule.target_bedtime,
                wake_time: schedule.target_wake,
              });
              refresh();
            }}
          >
            Log perfect night (hit targets)
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="card px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p
        className={cn(
          "text-xl font-bold",
          accent ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}
