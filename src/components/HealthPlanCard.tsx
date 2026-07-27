"use client";

import {
  Activity,
  AlertCircle,
  Clock,
  Droplets,
  Flame,
  Fish,
  Home,
  Leaf,
  Utensils,
} from "lucide-react";
import type { WeightLossPlanSummary, WeightLossProfile } from "@/lib/health";
import {
  ACTIVITY_LABELS,
  DIET_STYLE_LABELS,
  FASTING_PROTOCOL_LABELS,
  WEEKDAY_LABELS,
  formatMacrosLine,
  kgToLbs,
  sampleMealIdeas,
} from "@/lib/health";

export function HealthPlanCard({
  profile,
  plan,
}: {
  profile?: WeightLossProfile | null;
  plan: WeightLossPlanSummary;
}) {
  const diet = plan.diet_style || profile?.diet_style || "balanced";
  const mealPlan = plan.meal_plan;
  const meals =
    mealPlan?.meals.map((m) =>
      m.time ? `${m.label} (~${m.time}): ${m.ideas}` : `${m.label}: ${m.ideas}`
    ) ??
    sampleMealIdeas(plan.macros, diet, {
      friday_fish_only: plan.friday_fish_only,
    });
  const imperial = profile?.units === "imperial";
  const fastingDays = plan.fasting_days ?? profile?.fasting_days ?? [];
  const fastingProtocol =
    plan.fasting_protocol ?? profile?.fasting_protocol ?? "none";
  const fridayFish = plan.friday_fish_only ?? profile?.friday_fish_only;
  const hourByHour =
    plan.hour_by_hour_schedule ?? profile?.hour_by_hour_schedule;

  function w(kg: number) {
    return imperial ? `${Math.round(kgToLbs(kg))} lb` : `${kg.toFixed(1)} kg`;
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="border-b border-border bg-gradient-to-r from-emerald-500/15 to-sky-500/10 px-4 py-3">
          <h3 className="text-sm font-semibold leading-snug sm:text-base">
            Healthy nutrition &amp; movement plan
          </h3>
          <p className="text-xs text-muted">
            Estimates for guidance — not medical advice
          </p>
          {diet !== "balanced" && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              <Leaf className="h-3 w-3" />
              {DIET_STYLE_LABELS[diet]}
            </p>
          )}
        </div>

        {profile && (
          <div className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-xs">
            <div>
              <p className="text-muted">Now → goal</p>
              <p className="font-medium">
                {w(profile.current_weight_kg)} → {w(profile.goal_weight_kg)}
              </p>
            </div>
            <div>
              <p className="text-muted">BMI</p>
              <p className="font-medium">
                {plan.bmi_current} → {plan.bmi_goal}
              </p>
            </div>
            <div>
              <p className="text-muted">Activity</p>
              <p className="font-medium leading-snug">
                {ACTIVITY_LABELS[plan.activity_level].split(" (")[0]}
              </p>
            </div>
            <div>
              <p className="text-muted">Pace</p>
              <p className="font-medium">~{plan.weekly_loss_kg} kg/wk</p>
            </div>
          </div>
        )}

        <div className="grid gap-3 p-4">
          <div className="rounded-xl border border-orange-400/20 bg-orange-400/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-orange-300">
              <Flame className="h-3.5 w-3.5" /> Daily calories (approx)
            </p>
            <p className="mt-1 text-2xl font-bold">{plan.daily_calories}</p>
            <p className="text-[11px] text-muted">
              TDEE ~{plan.tdee} · deficit ~{plan.deficit_per_day} kcal
            </p>
          </div>

          <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-sky-300">
              <Droplets className="h-3.5 w-3.5" /> Water goal
            </p>
            <p className="mt-1 text-2xl font-bold">{plan.water_liters} L</p>
            <p className="text-[11px] text-muted">
              ~{plan.water_glasses} glasses (250 ml) · sip through the day
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Utensils className="h-4 w-4 shrink-0 text-accent" /> Meal macros
          </p>
          <p className="mb-2 break-words rounded-lg bg-black/25 px-3 py-2 text-sm text-accent">
            {formatMacrosLine(plan.macros)}
          </p>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
            <MacroBar
              label="Protein"
              value={plan.macros.protein_g}
              color="bg-emerald-400"
            />
            <MacroBar
              label="Carbs"
              value={plan.macros.carbs_g}
              color="bg-sky-400"
            />
            <MacroBar
              label="Fat"
              value={plan.macros.fat_g}
              color="bg-amber-400"
            />
          </div>

          {mealPlan && (
            <div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
              <p className="text-xs font-semibold text-accent">
                {mealPlan.label} meal plan
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {mealPlan.summary}
              </p>
            </div>
          )}

          <ul className="space-y-2 text-xs text-muted">
            {meals.map((m) => (
              <li key={m} className="leading-relaxed break-words">
                • {m}
              </li>
            ))}
          </ul>

          {mealPlan?.tips && mealPlan.tips.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-border/60 pt-3 text-[11px] text-muted">
              {mealPlan.tips.map((t) => (
                <li key={t} className="break-words">
                  💡 {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(fridayFish ||
        (fastingProtocol !== "none" && fastingDays.length > 0) ||
        hourByHour) && (
        <div className="card space-y-2 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Fish className="h-4 w-4 text-accent" />
            Observances &amp; schedule
          </p>
          {fridayFish && (
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-medium text-foreground">Friday fish:</span>{" "}
              no land meat on Fridays — fish, seafood, or plant proteins.
            </p>
          )}
          {fastingProtocol !== "none" && fastingDays.length > 0 && (
            <p className="text-xs leading-relaxed text-muted">
              <span className="font-medium text-foreground">Fasting:</span>{" "}
              {FASTING_PROTOCOL_LABELS[fastingProtocol]} on{" "}
              {fastingDays.map((d) => WEEKDAY_LABELS[d]).join(", ")}.
            </p>
          )}
          {hourByHour && (
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              Hour-by-hour day schedule is included in daily tasks.
            </p>
          )}
        </div>
      )}

      <div className="card p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          {plan.recommend_home_workouts ? (
            <Home className="h-4 w-4 shrink-0 text-accent" />
          ) : (
            <Activity className="h-4 w-4 shrink-0 text-accent" />
          )}
          {plan.recommend_home_workouts
            ? "Recommended home workouts (no equipment)"
            : "Movement guidance"}
        </p>
        <ul className="space-y-1.5 text-sm text-muted">
          {plan.home_workouts.map((w) => (
            <li key={w} className="flex gap-2">
              <span className="shrink-0 text-accent">✓</span>
              <span className="break-words leading-snug">{w}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-black/20 p-3 text-xs text-muted">
        <p className="mb-1.5 flex items-center gap-1 font-medium text-foreground">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-warn" /> Healthy
          approach
        </p>
        <ul className="space-y-1">
          {plan.healthy_notes.map((n) => (
            <li key={n} className="break-words">
              • {n}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] opacity-80">{plan.disclaimer}</p>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-black/20 p-2">
      <div className={`mx-auto mb-1 h-1.5 w-10 rounded-full ${color}`} />
      <p className="font-semibold text-foreground">{value}g</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}
