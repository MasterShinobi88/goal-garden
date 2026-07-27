"use client";

import { Flame, Percent, Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsBar({
  progress,
  streak,
  activeGoals,
  completedTasks,
}: {
  progress: number;
  streak: number;
  activeGoals: number;
  completedTasks: number;
}) {
  const items = [
    {
      label: "Progress",
      value: `${progress}%`,
      icon: Percent,
      tone: "text-accent bg-accent/10 ring-accent/15",
    },
    {
      label: "Streak",
      value: `${streak}d`,
      icon: Flame,
      tone: "text-orange-300 bg-orange-400/10 ring-orange-400/15",
    },
    {
      label: "Active",
      value: String(activeGoals),
      icon: Target,
      tone: "text-sky-300 bg-sky-400/10 ring-sky-400/15",
    },
    {
      label: "Done",
      value: String(completedTasks),
      icon: CheckCircle2,
      tone: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="card animate-fade-up px-4 py-3.5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-xl p-2.5 ring-1",
                  item.tone
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {item.label}
                </p>
                <p className="text-xl font-semibold tracking-tight tabular-nums">
                  {item.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
