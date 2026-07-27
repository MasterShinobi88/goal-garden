"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, PartyPopper, Sparkles } from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import {
  getTodayTasks,
  prideMessage,
  todayWinsStats,
} from "@/lib/today-wins";
import { cn, todayISO, formatDisplayDate } from "@/lib/utils";

export function TodayWins({
  goals,
  onToggle,
  compact,
}: {
  goals: GoalWithTree[];
  onToggle: (taskId: string, completed: boolean) => void;
  compact?: boolean;
}) {
  const items = useMemo(() => getTodayTasks(goals), [goals]);
  const stats = todayWinsStats(items);
  const pride = prideMessage(stats.done, stats.total);

  return (
    <section
      className={cn(
        "card flex h-full min-h-0 flex-col overflow-hidden p-0",
        compact && "min-h-[220px]"
      )}
    >
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-amber-500/[0.05] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="section-label mb-0.5">Today’s wins</p>
            <h2 className="text-sm font-semibold tracking-tight">
              {formatDisplayDate(todayISO())}
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-muted line-clamp-2">
              {pride}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-accent/20 bg-accent/10 px-2.5 py-1.5 text-center">
            <p className="text-lg font-semibold tabular-nums leading-none text-accent">
              {stats.done}
              <span className="text-xs font-medium text-muted">
                /{stats.total}
              </span>
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted">
              done
            </p>
          </div>
        </div>
        {stats.total > 0 && (
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-accent transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center px-3 py-8 text-center">
            <Sparkles className="mb-2 h-5 w-5 text-accent/70" />
            <p className="text-sm text-muted">
              Nothing scheduled for today yet.
            </p>
            <Link
              href="/dashboard/calendar"
              className="mt-2 text-xs font-medium text-accent hover:underline"
            >
              Add an event or open a goal →
            </Link>
          </div>
        ) : (
          <ul className="space-y-1.5 pb-2">
            {items.map(({ task, goalTitle, goalId }) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onToggle(task.id, !task.completed)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition",
                    task.completed
                      ? "border-accent/25 bg-accent/[0.08]"
                      : "border-border bg-black/20 hover:border-accent/30"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                      task.completed
                        ? "border-accent bg-accent text-[#052e1c]"
                        : "border-border"
                    )}
                  >
                    {task.completed && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-medium leading-snug",
                        task.completed && "text-muted line-through"
                      )}
                    >
                      {task.title}
                    </span>
                    <Link
                      href={`/dashboard/goals/${goalId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 block truncate text-[11px] text-muted hover:text-accent"
                    >
                      {goalTitle}
                    </Link>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {stats.done > 0 && stats.done === stats.total && stats.total > 0 && (
        <div className="shrink-0 border-t border-accent/20 bg-accent/[0.07] px-4 py-2.5 text-center text-xs text-accent">
          <PartyPopper className="mr-1 inline h-3.5 w-3.5" />
          Full clear — you earned this pride.
        </div>
      )}
    </section>
  );
}
