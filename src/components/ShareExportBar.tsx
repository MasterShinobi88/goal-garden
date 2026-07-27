"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Share2 } from "lucide-react";
import type { GoalWithTree } from "@/lib/types";
import {
  downloadShareCard,
  openPrintPlan,
  stageName,
} from "@/lib/export-plan";
import { calcGoalProgress } from "@/lib/utils";
import { getDailyLog } from "@/lib/daily-log";

export function ShareExportBar({
  goal,
  streak = 0,
  userName,
}: {
  goal: GoalWithTree;
  streak?: number;
  userName?: string;
}) {
  const [busy, setBusy] = useState<"card" | "pdf" | null>(null);

  async function shareCard() {
    setBusy("card");
    try {
      const progress = calcGoalProgress(goal);
      const tasks = goal.milestones.flatMap((m) => m.daily_tasks);
      const log = getDailyLog();
      await downloadShareCard({
        title: goal.title,
        progress,
        stage: stageName(progress),
        tasksDone: tasks.filter((t) => t.completed).length,
        tasksTotal: tasks.length,
        streak,
        waterLine: log
          ? `${log.water_glasses}/${log.water_target}`
          : goal.health_plan
            ? `${goal.health_plan.water_glasses} gl`
            : undefined,
        weekLabel: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-ghost text-sm"
        disabled={busy !== null}
        onClick={() => void shareCard()}
      >
        {busy === "card" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Share card
      </button>
      <button
        type="button"
        className="btn-ghost text-sm"
        disabled={busy !== null}
        onClick={() => {
          setBusy("pdf");
          openPrintPlan(goal, userName);
          setBusy(null);
        }}
      >
        {busy === "pdf" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Export PDF
      </button>
      <a
        className="btn-ghost text-sm"
        href="#milestones"
        onClick={(e) => {
          e.preventDefault();
          document
            .getElementById("milestones")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <Download className="h-4 w-4" />
        Jump to tasks
      </a>
    </div>
  );
}
