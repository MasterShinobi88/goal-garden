"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MilestoneList } from "@/components/MilestoneList";
import { ProgressTree } from "@/components/ProgressTree";
import { HealthPlanCard } from "@/components/HealthPlanCard";
import { LongevityMealCard } from "@/components/LongevityMealCard";
import { SavingsPlanCard } from "@/components/SavingsPlanCard";
import { EarningPlanCard } from "@/components/EarningPlanCard";
import { ShareExportBar } from "@/components/ShareExportBar";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import { calcGoalProgress, formatDisplayDate, daysUntil } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuthUser();
  const {
    goals,
    loading,
    streak,
    toggleTask,
    renameTask,
    renameMilestone,
    archive,
    restore,
    remove,
  } = useGoals(user?.id);

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  if (loading) return <LoadingSpinner />;

  if (!goal) {
    return (
      <div className="mx-auto flex h-full max-w-3xl items-center justify-center text-center">
        <div>
          <p className="text-muted">Goal not found.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-accent">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progress = calcGoalProgress(goal);
  const days = daysUntil(goal.deadline);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 space-y-2 border-b border-border/60 pb-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {goal.title}
            </h1>
            {goal.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {goal.description}
              </p>
            )}
            <p className="mt-1.5 text-xs text-muted">
              Deadline {formatDisplayDate(goal.deadline)} ·{" "}
              {days >= 0
                ? `${days} days left`
                : `${Math.abs(days)} days overdue`}
              {goal.success_metrics ? ` · ${goal.success_metrics}` : ""}
              {goal.archived ? " · Archived" : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <ShareExportBar
              goal={goal}
              streak={streak}
              userName={user?.name || user?.email || undefined}
            />
            <div className="flex flex-wrap gap-2">
              {goal.archived ? (
                <button
                  type="button"
                  className="btn-primary text-sm"
                  onClick={async () => {
                    await restore(goal.id);
                    router.push("/dashboard");
                  }}
                >
                  <ArchiveRestore className="h-4 w-4" />
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={async () => {
                    await archive(goal.id);
                    router.push("/dashboard");
                  }}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              )}
              <button
                type="button"
                className="btn-ghost text-sm text-danger"
                onClick={async () => {
                  if (
                    confirm(
                      "Permanently delete this goal and all milestones/tasks? This cannot be undone."
                    )
                  ) {
                    await remove(goal.id);
                    router.push("/dashboard");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable body — tree + health + all milestones.
          Left column is NOT sticky: sticky + overflow was clipping the
          nutrition/movement plan. Both columns scroll together so the full
          health card is always reachable. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-4 pb-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            <div className="card p-3">
              <ProgressTree
                progress={progress}
                label="This goal"
                size={220}
                plant={goal.plant_type}
              />
            </div>
            {goal.health_plan && (
              <HealthPlanCard
                profile={goal.health_profile}
                plan={goal.health_plan}
              />
            )}
            {goal.savings_plan && (
              <SavingsPlanCard
                profile={goal.savings_profile}
                plan={goal.savings_plan}
              />
            )}
            {goal.earning_plan && (
              <EarningPlanCard
                profile={goal.earning_profile}
                plan={goal.earning_plan}
              />
            )}
            {(goal.category === "longevity" ||
              /longevity|anti-?age|healthspan/i.test(goal.title)) && (
              <LongevityMealCard macros={goal.health_plan?.macros ?? null} />
            )}
          </div>
          <div id="milestones" className="min-w-0 pb-4">
            <MilestoneList
              milestones={goal.milestones}
              onToggleTask={toggleTask}
              onRenameTask={renameTask}
              onRenameMilestone={renameMilestone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
