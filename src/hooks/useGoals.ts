"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoalWithTree } from "@/lib/types";
import {
  ensureSessionForDemo,
  isDemoMode,
  loadGoals,
  loadStreak,
  saveGoals,
} from "@/lib/local-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  archiveGoal,
  createGoalWithPlan,
  fetchGoals,
  removeGoal,
  seedDemo,
  setMilestoneTitle,
  setTaskCompleted,
  setTaskDate,
  setTaskTitle,
} from "@/lib/goals-service";
import type { GeneratedPlan } from "@/lib/types";
import {
  applyProposals,
  buildRescheduleProposals,
  type RescheduleProposal,
} from "@/lib/reschedule";
import { getMockBusySlots } from "@/lib/calendar";
import { calcGoalProgress } from "@/lib/utils";
import { refreshPremiumFromAccount } from "@/lib/license";

export function useAuthUser() {
  const [user, setUser] = useState<{
    id: string;
    email?: string | null;
    name?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | undefined;

    function mapUser(u: {
      id: string;
      email?: string | null;
      user_metadata?: { display_name?: string };
    }) {
      return {
        id: u.id,
        email: u.email,
        name:
          u.user_metadata?.display_name ||
          u.email?.split("@")[0] ||
          null,
      };
    }

    async function load() {
      // Local demo / desktop only
      if (!isSupabaseConfigured() || isDemoMode()) {
        const s = ensureSessionForDemo();
        if (mounted) {
          setUser({
            id: s.id,
            email: s.email,
            name: s.display_name,
          });
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        if (data.user) {
          setUser(mapUser(data.user));
          await refreshPremiumFromAccount();
        } else {
          // Real accounts: no silent fake user
          setUser(null);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!mounted) return;
          if (session?.user) {
            setUser(mapUser(session.user));
            await refreshPremiumFromAccount();
          } else {
            setUser(null);
          }
        });
        unsub = () => subscription.unsubscribe();
      } catch {
        if (isDemoMode()) {
          const s = ensureSessionForDemo();
          if (mounted) {
            setUser({
              id: s.id,
              email: s.email,
              name: s.display_name,
            });
          }
        } else if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
      unsub?.();
    };
  }, []);

  return { user, loading };
}

export function useGoals(userId?: string) {
  const [goals, setGoals] = useState<GoalWithTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGoals(userId);
      setGoals(data);
      setStreak(loadStreak().streak);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load goals");
      setGoals(loadGoals());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const onUpdate = () => {
      setGoals(loadGoals());
      setStreak(loadStreak().streak);
    };
    window.addEventListener("goal-garden:update", onUpdate);
    return () => window.removeEventListener("goal-garden:update", onUpdate);
  }, [refresh]);

  const active = goals.filter((g) => !g.archived);
  const overallProgress =
    active.length === 0
      ? 0
      : Math.round(
          active.reduce((s, g) => s + calcGoalProgress(g), 0) / active.length
        );
  const completedTasks = goals
    .flatMap((g) => g.milestones.flatMap((m) => m.daily_tasks))
    .filter((t) => t.completed).length;

  async function addGoal(input: {
    title: string;
    description?: string;
    deadline: string;
    success_metrics?: string;
    category?: import("@/lib/types").GoalCategory;
    health_profile?: import("@/lib/health").WeightLossProfile;
    savings_profile?: import("@/lib/savings-plan").SavingsProfile;
    earning_profile?: import("@/lib/earning-plan").EarningProfile;
    plant_type?: import("@/lib/plants").PlantType;
  }) {
    if (!userId) throw new Error("Not signed in");
    // Free tier: cap active (non-archived) goals unless Premium
    const { canCreateAnotherGoal } = await import("@/lib/license");
    const active = goals.filter((g) => !g.archived).length;
    const gate = canCreateAnotherGoal(active);
    if (!gate.allowed) throw new Error(gate.reason || "Upgrade to Premium");
    const busy = getMockBusySlots();
    const { getAIRequestPayload } = await import("@/lib/ai-config-client");
    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        busySlots: busy,
        ai: getAIRequestPayload(),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Plan generation failed");
    }
    const plan = (await res.json()) as GeneratedPlan;
    const goal = await createGoalWithPlan(userId, input, plan);
    // Seed compound daily habits for longevity / mindset goals
    if (input.category === "longevity" || input.category === "mindset") {
      try {
        const { addSuggestedHabitsForCategory } = await import("@/lib/habits");
        addSuggestedHabitsForCategory(input.category);
      } catch {
        /* ignore */
      }
    }
    const next = loadGoals();
    setGoals(next);
    const { maybeAutoPublishFeed } = await import(
      "@/lib/calendar-sync-client"
    );
    void maybeAutoPublishFeed(next);
    return goal;
  }

  async function toggleTask(id: string, completed: boolean) {
    const next = await setTaskCompleted(id, completed);
    setGoals(next);
    setStreak(loadStreak().streak);
    const { maybeAutoPublishFeed } = await import(
      "@/lib/calendar-sync-client"
    );
    void maybeAutoPublishFeed(next);
  }

  async function renameTask(id: string, title: string) {
    setGoals(await setTaskTitle(id, title));
  }

  async function renameMilestone(id: string, title: string) {
    setGoals(await setMilestoneTitle(id, title));
  }

  async function applyReschedule(proposals: RescheduleProposal[]) {
    let next = loadGoals();
    for (const p of proposals) {
      next = await setTaskDate(p.taskId, p.to);
    }
    // ensure local consistency
    next = applyProposals(loadGoals(), proposals);
    saveGoals(next);
    setGoals(next);
    const { maybeAutoPublishFeed } = await import(
      "@/lib/calendar-sync-client"
    );
    void maybeAutoPublishFeed(next);
  }

  const getReschedule = useCallback(() => {
    return buildRescheduleProposals(goals, getMockBusySlots());
  }, [goals]);

  async function archive(id: string) {
    setGoals(await archiveGoal(id, true));
  }

  async function restore(id: string) {
    setGoals(await archiveGoal(id, false));
  }

  async function remove(id: string) {
    setGoals(await removeGoal(id));
  }

  async function loadDemo(kind: "project" | "weight_loss" | "both" = "both") {
    if (!userId) return;
    setGoals(await seedDemo(userId, kind));
  }

  return {
    goals,
    active,
    loading,
    error,
    streak,
    overallProgress,
    completedTasks,
    refresh,
    addGoal,
    toggleTask,
    renameTask,
    renameMilestone,
    applyReschedule,
    getReschedule,
    archive,
    restore,
    remove,
    loadDemo,
    setGoals,
  };
}
