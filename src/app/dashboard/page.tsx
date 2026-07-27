"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  FolderOpen,
  Moon,
  Plus,
  Scale,
  Sparkles,
  Sprout,
  Trophy,
} from "lucide-react";
import { AddGoalModal } from "@/components/AddGoalModal";
import { GoalCard } from "@/components/GoalCard";
import { ArchivedGoalCard } from "@/components/ArchivedGoalCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RescheduleBanner } from "@/components/RescheduleBanner";
import { WeeklyReviewModal } from "@/components/WeeklyReviewModal";
import { DailyHealthHUD } from "@/components/DailyHealthHUD";
import { DailyHabitsPanel } from "@/components/DailyHabitsPanel";
import { DashboardHero } from "@/components/DashboardHero";
import { TodayWins } from "@/components/TodayWins";
import { EmptyGardenArt } from "@/components/OnboardingTour";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import {
  calcGoalProgress,
  isReviewDay,
  weekStartISO,
  uid,
  cn,
} from "@/lib/utils";
import { loadPrefs, loadReviews, saveReview } from "@/lib/local-store";
import { summarizeWeek } from "@/lib/reschedule";
import { ENCOURAGING_COPY } from "@/lib/demo-data";
import type { RescheduleProposal } from "@/lib/reschedule";

type DashTab = "today" | "goals" | "archive";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const {
    goals,
    active,
    loading,
    error,
    streak,
    overallProgress,
    completedTasks,
    addGoal,
    applyReschedule,
    getReschedule,
    archive,
    restore,
    remove,
    loadDemo,
    toggleTask,
  } = useGoals(user?.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reschedule, setReschedule] = useState<{
    message: string;
    proposals: RescheduleProposal[];
  } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [demosOpen, setDemosOpen] = useState(false);
  const [dashTab, setDashTab] = useState<DashTab>("today");
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);

  const archived = useMemo(
    () => goals.filter((g) => g.archived),
    [goals]
  );

  const saplings = useMemo(
    () =>
      active.map((g) => ({
        id: g.id,
        title: g.title,
        progress: calcGoalProgress(g),
        plant: g.plant_type,
      })),
    [active]
  );

  useEffect(() => {
    if (!active.length) {
      setFocusedGoalId(null);
      return;
    }
    if (!focusedGoalId || !active.some((g) => g.id === focusedGoalId)) {
      setFocusedGoalId(active[0].id);
    }
  }, [active, focusedGoalId]);

  const focusedGoal =
    active.find((g) => g.id === focusedGoalId) ?? active[0] ?? null;
  const treeProgress = focusedGoal
    ? calcGoalProgress(focusedGoal)
    : overallProgress;
  const quote = useMemo(
    () => ENCOURAGING_COPY[new Date().getDay() % ENCOURAGING_COPY.length],
    []
  );
  const firstName = user?.name?.split(" ")[0];

  useEffect(() => {
    if (loading || !active.length) return;
    const result = getReschedule();
    if (result.proposals.length && !bannerDismissed) {
      setReschedule(result);
    } else {
      setReschedule(null);
    }
  }, [active, loading, bannerDismissed, getReschedule]);

  useEffect(() => {
    if (loading || !user) return;
    const prefs = loadPrefs();
    if (!prefs.sunday_review_enabled || !isReviewDay()) return;
    const week = weekStartISO();
    const existing = loadReviews().find(
      (r) => r.user_id === user.id && r.week_start === week
    );
    if (!existing) setReviewOpen(true);
  }, [loading, user, goals]);

  const weekSummary = summarizeWeek(goals, weekStartISO());
  const weightGoal = active.find((g) => g.health_plan) ?? null;
  const waterTarget = weightGoal?.health_plan?.water_glasses ?? 8;
  const kcalTarget = weightGoal?.health_plan?.daily_calories ?? null;
  const movementLabel =
    weightGoal?.health_plan?.home_workouts?.[0] ??
    "10-minute walk or home stretch";

  if (loading) {
    return <LoadingSpinner label="Opening your garden…" />;
  }

  const tabs: {
    id: DashTab;
    label: string;
    icon: typeof Sparkles;
    count?: number;
  }[] = [
    { id: "today", label: "Today", icon: Sparkles },
    { id: "goals", label: "Goals", icon: FolderOpen, count: active.length },
    { id: "archive", label: "Archive", icon: Archive, count: archived.length },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden">
      {/* Fixed top: hero */}
      <div className="shrink-0">
        <DashboardHero
          compact
          firstName={firstName}
          quote={quote}
          progress={focusedGoal ? treeProgress : 0}
          gardenProgress={active.length ? overallProgress : 0}
          streak={streak}
          activeGoals={active.length}
          completedTasks={completedTasks}
          treeLabel={
            focusedGoal ? focusedGoal.title : "Plant a goal to grow"
          }
          saplings={saplings}
          selectedSaplingId={focusedGoalId}
          onSelectSapling={(id) => {
            setFocusedGoalId(id);
            setDashTab("goals");
          }}
          demosOpen={demosOpen}
          onToggleDemos={() => setDemosOpen((v) => !v)}
          onDemo={(kind) => {
            loadDemo(kind);
            setDemosOpen(false);
            setDashTab("goals");
          }}
          onNewGoal={() => setModalOpen(true)}
        />
      </div>

      {error && (
        <p className="mt-2 shrink-0 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {/* Fixed top: section tabs */}
      <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border border-border bg-black/25 p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = dashTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setDashTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                  on
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {typeof t.count === "number" && (
                  <span className="tabular-nums text-[10px] opacity-80">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href="/dashboard/habits" className="btn-ghost text-xs">
            <Moon className="h-3.5 w-3.5" />
            Habits & sleep
          </Link>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Plant
          </button>
        </div>
      </div>

      {/* Scrollable lower pane only */}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 pb-2">
        {dashTab === "today" && (
          <div className="space-y-4">
            {reschedule && reschedule.proposals.length > 0 && (
              <RescheduleBanner
                message={reschedule.message}
                proposals={reschedule.proposals}
                onDismiss={() => {
                  setBannerDismissed(true);
                  setReschedule(null);
                }}
                onApply={async (proposals) => {
                  await applyReschedule(proposals);
                  setReschedule(null);
                  setBannerDismissed(true);
                }}
              />
            )}

            <DailyHabitsPanel />

            <DailyHealthHUD
              waterTarget={waterTarget}
              kcalTarget={kcalTarget}
              movementLabel={movementLabel}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-h-[240px] max-h-[360px]">
                <TodayWins
                  goals={active}
                  onToggle={(id, done) => void toggleTask(id, done)}
                  compact
                />
              </div>
              <div className="card flex flex-col p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Trophy className="h-4 w-4 text-accent" />
                    Active goals
                  </p>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-accent hover:underline"
                    onClick={() => setDashTab("goals")}
                  >
                    View all →
                  </button>
                </div>
                {active.length === 0 ? (
                  <p className="text-xs text-muted">
                    No active goals yet. Plant one to grow a sapling.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {active.map((g) => {
                      const pct = calcGoalProgress(g);
                      const focused = g.id === focusedGoalId;
                      return (
                        <li key={g.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setFocusedGoalId(g.id);
                              setDashTab("goals");
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                              focused
                                ? "border-accent/40 bg-accent/10"
                                : "border-border bg-black/20 hover:border-accent/25"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {g.title}
                              </p>
                              <p className="text-[11px] text-muted">
                                {pct}% grown
                              </p>
                            </div>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {dashTab === "goals" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                {active.length} active · click a card to focus its tree
              </p>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                New goal
              </button>
            </div>

            {active.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <EmptyGardenArt compact />
                <h3 className="mt-2 text-base font-semibold">
                  {archived.length > 0
                    ? "No active goals"
                    : "Your soil is ready"}
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted">
                  {archived.length > 0
                    ? "Everything is archived. Restore one or plant something new."
                    : "Plant a goal or load a sample plan."}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {archived.length > 0 && (
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => setDashTab("archive")}
                    >
                      <Archive className="h-3.5 w-3.5" />
                      View archive
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => loadDemo("weight_loss")}
                  >
                    <Scale className="h-3.5 w-3.5" />
                    Health demo
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => loadDemo("project")}
                  >
                    <Sprout className="h-3.5 w-3.5" />
                    Project
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setModalOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Plant
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
                {active.map((g) => (
                  <div
                    key={g.id}
                    className={cn(
                      "rounded-[1.2rem] transition",
                      focusedGoalId === g.id && "ring-2 ring-accent/50"
                    )}
                    onClick={() => setFocusedGoalId(g.id)}
                  >
                    <GoalCard
                      goal={g}
                      onArchive={(id) => {
                        void archive(id);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {dashTab === "archive" && (
          <div className="space-y-3">
            {archived.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <Archive className="mb-2 h-8 w-8 text-muted/50" />
                <h3 className="text-sm font-semibold">Archive is empty</h3>
                <p className="mt-1 max-w-xs text-xs text-muted">
                  When you archive a goal, it leaves Active and lands here. You
                  can restore it or delete it forever.
                </p>
                <button
                  type="button"
                  className="btn-ghost mt-4 text-xs"
                  onClick={() => setDashTab("goals")}
                >
                  Back to goals
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted">
                  Archived goals are hidden from Today’s wins and calendar
                  progress. Restore to bring them back, or delete permanently.
                </p>
                <div className="space-y-2">
                  {archived.map((g) => (
                    <ArchivedGoalCard
                      key={g.id}
                      goal={g}
                      onRestore={(id) => {
                        void restore(id);
                        setDashTab("goals");
                      }}
                      onDelete={(id) => void remove(id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AddGoalModal
        open={modalOpen}
        onClose={() => !creating && setModalOpen(false)}
        onSubmit={async (data) => {
          setCreating(true);
          try {
            await addGoal(data);
            setDashTab("goals");
          } finally {
            setCreating(false);
          }
        }}
      />

      <WeeklyReviewModal
        open={reviewOpen}
        completed={weekSummary.completed}
        missed={weekSummary.missed}
        remaining={weekSummary.remaining}
        suggestions={weekSummary.suggestions}
        onClose={() => setReviewOpen(false)}
        onSave={(notes) => {
          if (!user) return;
          saveReview({
            id: uid(),
            user_id: user.id,
            week_start: weekStartISO(),
            completed_count: weekSummary.completed,
            missed_count: weekSummary.missed,
            reflection_notes: notes,
            suggestions: weekSummary.suggestions,
            created_at: new Date().toISOString(),
          });
        }}
      />
    </div>
  );
}
