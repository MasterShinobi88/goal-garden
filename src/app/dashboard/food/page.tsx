"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  Copy,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
} from "lucide-react";
import {
  FOOD_DB,
  findFoodById,
  scaleFood,
  searchFoods,
  sumMacros,
  unitLabel,
  type FoodItem,
  type MacroTotals,
} from "@/lib/food-db";
import {
  addFoodLogEntry,
  clearFoodLog,
  foodLogTotals,
  getFoodLog,
  removeFoodLogEntry,
  type LoggedFood,
} from "@/lib/food-log";
import { getDailyLog } from "@/lib/daily-log";
import { getAIRequestPayload } from "@/lib/ai-config-client";
import {
  clearShoppingChecks,
  dayMacroDelta,
  exportShoppingText,
  generateWeeklyMealPlan,
  loadMealPlan,
  openPrintShoppingList,
  saveMealPlan,
  shoppingByCategory,
  toggleShoppingItem,
  type WeeklyMealPlan,
} from "@/lib/meal-planner";
import {
  DIET_STYLE_LABELS,
  type DietStyle,
  type MacroTargets,
} from "@/lib/health";
import { cn, formatDisplayDate } from "@/lib/utils";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import { PageHeader } from "@/components/PageHeader";

type DraftLine = {
  foodId: string;
  amount: string;
};

type TabId = "log" | "plan" | "shop";

export default function FoodPage() {
  const { user } = useAuthUser();
  const { active } = useGoals(user?.id);
  const healthGoal = active.find((g) => g.health_plan);
  const plan = healthGoal?.health_plan;
  const profile = healthGoal?.health_profile;

  const targets: MacroTargets | null = plan
    ? plan.macros
    : null;
  const kcalTarget = plan?.daily_calories ?? null;
  const dietFromGoal = (plan?.diet_style ||
    profile?.diet_style ||
    "balanced") as DietStyle;
  const fridayFish = Boolean(
    plan?.friday_fish_only || profile?.friday_fish_only
  );

  const [tab, setTab] = useState<TabId>("log");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<DraftLine[]>([]);
  const [quick, setQuick] = useState("");
  const [log, setLog] = useState<LoggedFood[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [planDiet, setPlanDiet] = useState<DietStyle>("balanced");
  const [selectedDay, setSelectedDay] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshLog = useCallback(() => {
    setLog(getFoodLog());
  }, []);

  useEffect(() => {
    refreshLog();
    const on = () => refreshLog();
    window.addEventListener("goal-garden:food-log", on);
    window.addEventListener("goal-garden:daily-log", on);
    return () => {
      window.removeEventListener("goal-garden:food-log", on);
      window.removeEventListener("goal-garden:daily-log", on);
    };
  }, [refreshLog]);

  useEffect(() => {
    const saved = loadMealPlan();
    if (saved) {
      setMealPlan(saved);
      setPlanDiet(saved.diet_style);
    }
    setPlanDiet((d) => (saved ? saved.diet_style : dietFromGoal || d));
  }, [dietFromGoal]);

  useEffect(() => {
    const on = () => setMealPlan(loadMealPlan());
    window.addEventListener("goal-garden:meal-plan", on);
    return () => window.removeEventListener("goal-garden:meal-plan", on);
  }, []);

  const results = useMemo(() => searchFoods(query, 10), [query]);

  const draftMacros = useMemo(() => {
    return drafts.map((d) => {
      const food = findFoodById(d.foodId);
      if (!food) return null;
      const amount = parseFloat(d.amount) || 0;
      return { food, amount, macros: scaleFood(food, amount) };
    });
  }, [drafts]);

  const draftTotal = useMemo(() => {
    const macros = draftMacros
      .filter(Boolean)
      .map((x) => (x as { macros: MacroTotals }).macros);
    return sumMacros(macros);
  }, [draftMacros]);

  const dayTotals = foodLogTotals();
  const hud = getDailyLog();

  function addFoodToDraft(food: FoodItem) {
    const defaultAmount =
      food.unit === "g" || food.unit === "ml"
        ? String(food.servingSize)
        : "1";
    setDrafts((d) => [...d, { foodId: food.id, amount: defaultAmount }]);
    setQuery("");
    setNote(`Added ${food.name}`);
  }

  function logDrafts() {
    for (const row of draftMacros) {
      if (!row || row.amount <= 0) continue;
      addFoodLogEntry({
        name: row.food.name,
        amountLabel: `${row.amount} ${unitLabel(row.food.unit)}`,
        macros: row.macros,
        source: "db",
      });
    }
    setDrafts([]);
    refreshLog();
    setNote("Logged to today — Daily HUD calories updated.");
  }

  async function estimateAndLogQuick() {
    const line = quick.trim();
    if (!line) return;
    setEstimating(true);
    setError(null);
    try {
      const res = await fetch("/api/food-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line,
          ai: getAIRequestPayload(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Estimate failed");

      addFoodLogEntry({
        name: data.name,
        amountLabel: data.amountLabel,
        macros: data.macros,
        source:
          data.source === "db"
            ? "db"
            : data.source === "ai"
              ? "ai"
              : "manual",
      });
      setQuick("");
      refreshLog();
      setNote(
        data.source === "db"
          ? "Matched food database (high confidence)."
          : data.source === "ai"
            ? `Estimated via ${data.provider || "AI"}.`
            : data.note || "Rough estimate — double-check if important."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not estimate");
    } finally {
      setEstimating(false);
    }
  }

  function handleGeneratePlan() {
    const t: MacroTargets = targets || {
      calories: 2000,
      protein_g: 140,
      carbs_g: 200,
      fat_g: 65,
    };
    setGenerating(true);
    try {
      const next = generateWeeklyMealPlan({
        targets: t,
        diet_style: planDiet,
        friday_fish_only: fridayFish,
      });
      saveMealPlan(next);
      setMealPlan(next);
      setSelectedDay(0);
      setNote(
        `Generated 7-day ${DIET_STYLE_LABELS[planDiet]} plan aimed at ~${t.calories} kcal / P${t.protein_g}g.`
      );
      setTab("plan");
    } finally {
      setGenerating(false);
    }
  }

  function logPlannedMeal(
    foods: { name: string; amount: number; unit: string; macros: MacroTotals }[]
  ) {
    for (const f of foods) {
      addFoodLogEntry({
        name: f.name,
        amountLabel: `${f.amount} ${f.unit}`,
        macros: f.macros,
        source: "db",
      });
    }
    refreshLog();
    setNote("Meal logged to today.");
    setTab("log");
  }

  function onToggleShop(itemId: string) {
    if (!mealPlan) return;
    const next = toggleShoppingItem(mealPlan, itemId);
    saveMealPlan(next);
    setMealPlan(next);
  }

  async function copyShoppingList() {
    if (!mealPlan) return;
    const text = exportShoppingText(mealPlan);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — try selecting the list manually.");
    }
  }

  function printShoppingList(hideChecked = false) {
    if (!mealPlan) return;
    openPrintShoppingList(mealPlan, {
      hideChecked,
      title: hideChecked
        ? "Shopping list (still to buy)"
        : "Weekly shopping list",
    });
  }

  const activeDay = mealPlan?.days[selectedDay];
  const shopGroups = mealPlan
    ? shoppingByCategory(mealPlan.shopping)
    : [];
  const shopDone = mealPlan
    ? mealPlan.shopping.filter((s) => s.checked).length
    : 0;
  const shopTotal = mealPlan?.shopping.length ?? 0;

  const tabs: { id: TabId; label: string; icon: typeof Utensils }[] = [
    { id: "log", label: "Log", icon: Utensils },
    { id: "plan", label: "Meal plan", icon: ClipboardList },
    { id: "shop", label: "Shopping", icon: ShoppingCart },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-3 overflow-hidden animate-fade-up">
      <div className="shrink-0 space-y-3">
        <PageHeader
          eyebrow="Nutrition"
          title="Food & meal planner"
          description="Log calories, generate a week of meals that hit your macros, and build a shopping list."
        />

        <div className="flex gap-1 rounded-xl border border-border bg-black/20 p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const activeTab = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm",
                  activeTab
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Macro targets strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Today kcal"
            value={String(dayTotals.kcal || hud?.kcal_eaten || 0)}
            sub={
              kcalTarget
                ? `of ~${kcalTarget}`
                : targets
                  ? `of ~${targets.calories}`
                  : "logged"
            }
            accent
          />
          <Stat
            label="Protein"
            value={`${dayTotals.protein_g}g`}
            sub={targets ? `goal ${targets.protein_g}g` : undefined}
          />
          <Stat
            label="Carbs"
            value={`${dayTotals.carbs_g}g`}
            sub={targets ? `goal ${targets.carbs_g}g` : undefined}
          />
          <Stat
            label="Fat"
            value={`${dayTotals.fat_g}g`}
            sub={targets ? `goal ${targets.fat_g}g` : undefined}
          />
        </div>

        {(kcalTarget != null || targets) && (
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                dayTotals.kcal > (kcalTarget || targets!.calories)
                  ? "bg-warn"
                  : "bg-accent"
              )}
              style={{
                width: `${Math.min(
                  100,
                  (dayTotals.kcal / (kcalTarget || targets!.calories)) * 100
                )}%`,
              }}
            />
          </div>
        )}

        {note && tab !== "log" && (
          <p className="text-xs text-accent">{note}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2">
        {tab === "log" && (
          <>
            <section className="card space-y-3 p-4">
              <h2 className="text-sm font-semibold">Quick add (auto-calc)</h2>
              <p className="text-xs text-muted">
                Try: <code className="text-accent">200g chicken</code>,{" "}
                <code className="text-accent">2 eggs</code>,{" "}
                <code className="text-accent">1 tbsp olive oil</code>
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void estimateAndLogQuick();
                }}
              >
                <input
                  className="input-field flex-1"
                  placeholder="e.g. 150g rice cooked"
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary shrink-0"
                  disabled={estimating || !quick.trim()}
                >
                  {estimating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </button>
              </form>
              {error && <p className="text-xs text-danger">{error}</p>}
              {note && <p className="text-xs text-accent">{note}</p>}
            </section>

            <section className="card space-y-3 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Search className="h-4 w-4 text-accent" />
                Search food database ({FOOD_DB.length} foods)
              </h2>
              <input
                className="input-field"
                placeholder="Search chicken, rice, banana…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {results.length === 0 && (
                    <li className="text-xs text-muted">
                      No match — use Quick add (AI/heuristic will estimate).
                    </li>
                  )}
                  {results.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-black/20 px-3 py-2 text-left text-sm hover:border-accent/40"
                        onClick={() => addFoodToDraft(f)}
                      >
                        <span>
                          {f.name}
                          <span className="mt-0.5 block text-[11px] text-muted">
                            {f.kcal} kcal / {f.servingSize}
                            {unitLabel(f.unit)} · P{f.protein_g} C{f.carbs_g} F
                            {f.fat_g}
                          </span>
                        </span>
                        <Plus className="h-4 w-4 shrink-0 text-accent" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {drafts.length > 0 && (
              <section className="card space-y-3 p-4">
                <h2 className="text-sm font-semibold">
                  This meal (not logged yet)
                </h2>
                <ul className="space-y-2">
                  {drafts.map((d, i) => {
                    const food = findFoodById(d.foodId);
                    if (!food) return null;
                    const macros = scaleFood(food, parseFloat(d.amount) || 0);
                    return (
                      <li
                        key={`${d.foodId}-${i}`}
                        className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-black/20 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 text-sm">
                          {food.name}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className="input-field w-24 py-1 text-sm"
                          value={d.amount}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDrafts((list) =>
                              list.map((x, j) =>
                                j === i ? { ...x, amount: v } : x
                              )
                            );
                          }}
                        />
                        <span className="text-xs text-muted">
                          {unitLabel(food.unit)}
                        </span>
                        <span className="w-16 text-right text-sm text-accent">
                          {macros.kcal} kcal
                        </span>
                        <button
                          type="button"
                          className="p-1 text-muted hover:text-danger"
                          onClick={() =>
                            setDrafts((list) =>
                              list.filter((_, j) => j !== i)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <p className="text-sm">
                    Meal total:{" "}
                    <strong className="text-accent">
                      {draftTotal.kcal} kcal
                    </strong>
                    <span className="text-muted">
                      {" "}
                      · P{draftTotal.protein_g} C{draftTotal.carbs_g} F
                      {draftTotal.fat_g}
                    </span>
                  </p>
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    onClick={logDrafts}
                  >
                    <Utensils className="h-4 w-4" />
                    Log meal to today
                  </button>
                </div>
              </section>
            )}

            <section className="card space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Today&apos;s food log
                </h2>
                {log.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-danger"
                    onClick={() => {
                      if (confirm("Clear today’s food log?")) {
                        clearFoodLog();
                        refreshLog();
                      }
                    }}
                  >
                    Clear day
                  </button>
                )}
              </div>
              {log.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing logged yet. Quick-add a food, or log a meal from the
                  Meal plan tab.
                </p>
              ) : (
                <ul className="space-y-2">
                  {log.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[11px] text-muted">
                          {item.amountLabel} · {item.source} · P
                          {item.macros.protein_g} C{item.macros.carbs_g} F
                          {item.macros.fat_g}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-accent">{item.macros.kcal}</span>
                        <button
                          type="button"
                          className="p-1 text-muted hover:text-danger"
                          onClick={() => {
                            removeFoodLogEntry(item.id);
                            refreshLog();
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-muted">
                Values are approximate averages for planning — not lab analysis
                or medical advice.
              </p>
            </section>
          </>
        )}

        {tab === "plan" && (
          <>
            <section className="card space-y-3 p-4">
              <h2 className="text-sm font-semibold">
                Generate a week aimed at your macros
              </h2>
              {!targets && (
                <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
                  No weight-loss goal macros found — using defaults (~2000 kcal).
                  Create a weight-loss goal for personal targets.
                </p>
              )}
              {targets && (
                <p className="text-xs text-muted">
                  Targets from your health plan:{" "}
                  <span className="text-accent">
                    ~{targets.calories} kcal · P{targets.protein_g}g · C
                    {targets.carbs_g}g · F{targets.fat_g}g
                  </span>
                  {fridayFish ? " · Friday fish-only on" : ""}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs text-muted">
                    Diet style
                  </label>
                  <select
                    className="input-field"
                    value={planDiet}
                    onChange={(e) =>
                      setPlanDiet(e.target.value as DietStyle)
                    }
                  >
                    {(
                      Object.entries(DIET_STYLE_LABELS) as [
                        DietStyle,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  disabled={generating}
                  onClick={handleGeneratePlan}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {mealPlan ? "Regenerate week" : "Generate week"}
                </button>
              </div>
            </section>

            {!mealPlan ? (
              <div className="card p-8 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-muted/50" />
                <p className="mt-3 text-sm text-muted">
                  Generate a 7-day meal plan scaled to hit your daily calories
                  and macros. A weekly shopping list is built automatically.
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {mealPlan.days.map((day, i) => {
                    const on = selectedDay === i;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => setSelectedDay(i)}
                        className={cn(
                          "shrink-0 rounded-xl border px-3 py-2 text-left transition",
                          on
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border bg-black/20 text-muted hover:text-foreground"
                        )}
                      >
                        <p className="text-[10px] font-medium uppercase tracking-wide">
                          {day.weekday.slice(0, 3)}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {day.date.slice(8)}
                        </p>
                        <p className="text-[10px]">{day.hitScore}% hit</p>
                      </button>
                    );
                  })}
                </div>

                {activeDay && (
                  <section className="card space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold">
                          {activeDay.weekday} ·{" "}
                          {formatDisplayDate(activeDay.date)}
                        </h2>
                        <p className="text-xs text-muted">
                          Day total{" "}
                          <span className="text-accent">
                            {activeDay.totals.kcal} kcal
                          </span>{" "}
                          · P{activeDay.totals.protein_g} C
                          {activeDay.totals.carbs_g} F{activeDay.totals.fat_g}
                          {" · "}
                          hit score {activeDay.hitScore}%
                        </p>
                        {mealPlan.targets && (
                          <DayDelta
                            totals={activeDay.totals}
                            targets={mealPlan.targets}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => setTab("shop")}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Shopping list
                      </button>
                    </div>

                    <ul className="space-y-3">
                      {activeDay.meals.map((meal) => (
                        <li
                          key={meal.slot}
                          className="rounded-xl border border-border bg-black/20 p-3"
                        >
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{meal.label}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted">
                                {meal.macros.kcal} kcal · P
                                {meal.macros.protein_g} C{meal.macros.carbs_g}{" "}
                                F{meal.macros.fat_g}
                              </span>
                              <button
                                type="button"
                                className="btn-ghost px-2 py-1 text-[11px]"
                                onClick={() => logPlannedMeal(meal.foods)}
                              >
                                <Plus className="h-3 w-3" />
                                Log
                              </button>
                            </div>
                          </div>
                          <ul className="space-y-1 text-xs text-muted">
                            {meal.foods.map((f) => (
                              <li
                                key={`${meal.slot}-${f.foodId}`}
                                className="flex justify-between gap-2"
                              >
                                <span>
                                  {f.amount} {f.unit} {f.name}
                                </span>
                                <span className="shrink-0 text-foreground/80">
                                  {f.macros.kcal} kcal
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted">
                      Portions are scaled estimates to approach your targets —
                      tweak amounts when you cook. Not medical advice.
                    </p>
                  </section>
                )}

                {/* Week overview strip */}
                <section className="card p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Week at a glance
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead>
                        <tr className="text-muted">
                          <th className="pb-2 font-medium">Day</th>
                          <th className="pb-2 font-medium">Kcal</th>
                          <th className="pb-2 font-medium">P</th>
                          <th className="pb-2 font-medium">C</th>
                          <th className="pb-2 font-medium">F</th>
                          <th className="pb-2 font-medium">Hit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mealPlan.days.map((d, i) => (
                          <tr
                            key={d.date}
                            className={cn(
                              "border-t border-border/50",
                              i === selectedDay && "bg-accent/5"
                            )}
                          >
                            <td className="py-1.5 pr-2">
                              <button
                                type="button"
                                className="font-medium text-foreground hover:text-accent"
                                onClick={() => setSelectedDay(i)}
                              >
                                {d.weekday.slice(0, 3)}
                              </button>
                            </td>
                            <td className="py-1.5 text-accent">{d.totals.kcal}</td>
                            <td className="py-1.5">{d.totals.protein_g}g</td>
                            <td className="py-1.5">{d.totals.carbs_g}g</td>
                            <td className="py-1.5">{d.totals.fat_g}g</td>
                            <td className="py-1.5">{d.hitScore}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {tab === "shop" && (
          <>
            {!mealPlan ? (
              <div className="card p-8 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted/50" />
                <p className="mt-3 text-sm text-muted">
                  Generate a meal plan first — we&apos;ll roll all ingredients
                  into a weekly shopping list by aisle.
                </p>
                <button
                  type="button"
                  className="btn-primary mx-auto mt-4"
                  onClick={() => setTab("plan")}
                >
                  Go to meal plan
                </button>
              </div>
            ) : (
              <section className="card flex min-h-0 flex-col p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Weekly shopping list
                    </h2>
                    <p className="text-xs text-muted">
                      Week of {formatDisplayDate(mealPlan.weekStart)} ·{" "}
                      {DIET_STYLE_LABELS[mealPlan.diet_style]} · {shopDone}/
                      {shopTotal} checked
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-primary text-xs"
                      onClick={() => printShoppingList(false)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print list
                    </button>
                    {shopDone > 0 && (
                      <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => printShoppingList(true)}
                        title="Print only items you still need"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print remaining
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => void copyShoppingList()}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy list"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost text-xs"
                      onClick={() => {
                        const next = clearShoppingChecks(mealPlan);
                        saveMealPlan(next);
                        setMealPlan(next);
                      }}
                    >
                      Uncheck all
                    </button>
                  </div>
                </div>

                {shopTotal > 0 && (
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${(shopDone / shopTotal) * 100}%`,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {shopGroups.map((group) => (
                    <div key={group.category}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {group.label}
                      </p>
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition",
                                item.checked
                                  ? "border-accent/20 bg-accent/5 opacity-70"
                                  : "border-border bg-black/20 hover:border-accent/30"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="accent-emerald-500"
                                checked={item.checked}
                                onChange={() => onToggleShop(item.id)}
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 text-sm",
                                  item.checked && "line-through text-muted"
                                )}
                              >
                                {item.name}
                              </span>
                              <span className="shrink-0 text-xs font-medium text-accent">
                                {item.displayAmount}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] text-muted">
                  Quantities include a small buffer for cooked proteins/grains.
                  Buy what you need — pantry staples may already be at home.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DayDelta({
  totals,
  targets,
}: {
  totals: MacroTotals;
  targets: MacroTargets;
}) {
  const d = dayMacroDelta(totals, targets);
  function fmt(n: number, unit = "") {
    const sign = n > 0 ? "+" : "";
    return `${sign}${n}${unit}`;
  }
  return (
    <p className="mt-0.5 text-[11px] text-muted">
      vs target: {fmt(d.kcal)} kcal · P{fmt(d.protein_g, "g")} · C
      {fmt(d.carbs_g, "g")} · F{fmt(d.fat_g, "g")}
    </p>
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
