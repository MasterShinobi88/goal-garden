"use client";

import Link from "next/link";
import { Archive, ArrowUpRight, Calendar, Droplets, Scale } from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import { categoryEmoji, categoryLabel } from "@/lib/goal-types";
import { getPlant } from "@/lib/plants";
import { calcGoalProgress, daysUntil, formatDisplayDate, cn } from "@/lib/utils";

export function GoalCard({
  goal,
  onArchive,
}: {
  goal: GoalWithTree;
  onArchive?: (id: string) => void;
}) {
  const progress = calcGoalProgress(goal);
  const days = daysUntil(goal.deadline);
  const taskCount = goal.milestones.reduce(
    (n, m) => n + m.daily_tasks.length,
    0
  );
  const done = goal.milestones.reduce(
    (n, m) => n + m.daily_tasks.filter((t) => t.completed).length,
    0
  );
  const isHealth = goal.category === "weight_loss" || Boolean(goal.health_plan);
  const plant = getPlant(goal.plant_type);

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden p-0">
      {/* Top accent */}
      <div
        className={cn(
          "h-1 w-full",
          isHealth
            ? "bg-gradient-to-r from-sky-600/80 via-sky-400/50 to-transparent"
            : "bg-gradient-to-r from-emerald-700/80 via-accent/50 to-transparent"
        )}
      />

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-black/25 px-2 py-0.5 text-[10px] text-muted">
            {categoryEmoji(goal.category)} {categoryLabel(goal.category)}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full border border-border bg-black/25 px-2 py-0.5 text-[10px] text-muted"
            title={plant.blurb}
          >
            {plant.emoji} {plant.label}
          </span>
          {goal.archived && (
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              Archived
            </span>
          )}
          {isHealth && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-300 ring-1 ring-sky-400/15">
              <Scale className="h-3 w-3" />
              Health
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Calendar className="h-3 w-3 opacity-60" />
            {formatDisplayDate(goal.deadline)}
            <span
              className={cn(
                "tabular-nums",
                days < 0 ? "text-warn" : "text-muted/70"
              )}
            >
              · {days >= 0 ? `${days}d left` : `${Math.abs(days)}d overdue`}
            </span>
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-tight">
              {goal.title}
            </h3>
            {goal.success_metrics && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                {goal.success_metrics}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums tracking-tight",
                isHealth ? "text-sky-300" : "text-accent"
              )}
            >
              {progress}
              <span className="text-sm font-medium text-muted">%</span>
            </p>
            <p className="text-[11px] tabular-nums text-muted">
              {done}/{taskCount}
            </p>
          </div>
        </div>

        {goal.health_plan && (
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-sky-300/85">
            <span className="tabular-nums">
              ~{goal.health_plan.daily_calories} kcal
            </span>
            <span className="text-muted/40">·</span>
            <span className="inline-flex items-center gap-0.5">
              <Droplets className="h-3 w-3" />
              {goal.health_plan.water_liters} L
            </span>
            <span className="text-muted/40">·</span>
            <span>P {goal.health_plan.macros.protein_g}g</span>
          </p>
        )}

        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isHealth
                ? "bg-gradient-to-r from-sky-700 to-sky-300"
                : "bg-gradient-to-r from-emerald-800 to-accent"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-auto flex items-center justify-between pt-3.5">
          <p className="text-[11px] text-muted">
            {goal.milestones.length} milestone
            {goal.milestones.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-1">
            {!goal.archived && onArchive && (
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-white/5 hover:text-foreground group-hover:opacity-100"
                onClick={() => onArchive(goal.id)}
                title="Archive"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            <Link
              href={`/dashboard/goals/${goal.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1.5 text-xs font-semibold text-accent ring-1 ring-accent/15 transition hover:bg-accent/15"
            >
              Open
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
