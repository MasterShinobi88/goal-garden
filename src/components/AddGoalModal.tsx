"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  Activity,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Loader2,
  PiggyBank,
  Ruler,
  Sparkles,
  Scale,
  X,
} from "lucide-react";
import {
  ACTIVITY_LABELS,
  DIET_STYLE_LABELS,
  FASTING_PROTOCOL_LABELS,
  WEEKDAY_LABELS,
  buildWeightLossPlan,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  validateWeightLossProfile,
  type ActivityLevel,
  type DietStyle,
  type FastingProtocol,
  type Sex,
  type WeightLossProfile,
} from "@/lib/health";
import {
  PURPOSE_LABELS,
  buildSavingsPlan,
  formatMoneyAmount,
  parseAmountFromText,
  validateSavingsProfile,
  type SavingsProfile,
  type SavingsPurpose,
} from "@/lib/savings-plan";
import {
  EARNING_FOCUS_LABELS,
  buildEarningPlan,
  suggestEarningFocus,
  validateEarningProfile,
  type EarningFocus,
  type EarningProfile,
} from "@/lib/earning-plan";
import {
  DEFAULT_PLANT,
  PLANTS,
  PLANT_TYPES,
  suggestPlantFromTitle,
  type PlantType,
} from "@/lib/plants";
import {
  GOAL_KINDS,
  GOAL_KIND_META,
  getGoalKindMeta,
  suggestKindFromText,
  type GoalKind,
} from "@/lib/goal-types";
import type { GoalCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export type NewGoalInput = {
  title: string;
  description?: string;
  deadline: string;
  success_metrics?: string;
  category?: GoalCategory;
  health_profile?: WeightLossProfile;
  savings_profile?: SavingsProfile;
  earning_profile?: EarningProfile;
  plant_type?: PlantType;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewGoalInput) => Promise<void>;
};

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS) as [
  ActivityLevel,
  string,
][];

export function AddGoalModal({ open, onClose, onSubmit }: Props) {
  const defaultDeadline = format(addDays(new Date(), 84), "yyyy-MM-dd");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [metrics, setMetrics] = useState("");
  /** User-picked goal type (health, money, fitness, …) */
  const [goalKind, setGoalKind] = useState<GoalKind>("general");
  const [kindTouched, setKindTouched] = useState(false);
  const [units, setUnits] = useState<"metric" | "imperial">("metric");

  // Savings fields
  const [saveTarget, setSaveTarget] = useState("");
  const [saveAlready, setSaveAlready] = useState("0");
  const [saveCurrency, setSaveCurrency] = useState("USD");
  const [savePurpose, setSavePurpose] = useState<SavingsPurpose>("general");
  const [saveCadence, setSaveCadence] = useState<
    "daily" | "weekly" | "biweekly"
  >("daily");

  // Earning / job fields
  const [earnFocus, setEarnFocus] = useState<EarningFocus>("job");
  const [earnRole, setEarnRole] = useState("");
  const [earnIncome, setEarnIncome] = useState("");
  const [earnCurrency, setEarnCurrency] = useState("USD");
  const [earnHours, setEarnHours] = useState("10");
  const [earnStatus, setEarnStatus] = useState("");

  const [plantType, setPlantType] = useState<PlantType>(DEFAULT_PLANT);
  const [plantTouched, setPlantTouched] = useState(false);

  // Display fields (unit-aware)
  const [currentWeight, setCurrentWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [heightMajor, setHeightMajor] = useState(""); // cm or feet
  const [heightMinor, setHeightMinor] = useState(""); // inches leftover
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<Sex>("female");
  const [activity, setActivity] = useState<ActivityLevel>("sedentary");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [chest, setChest] = useState("");
  const [dietStyle, setDietStyle] = useState<DietStyle>("balanced");
  const [fridayFishOnly, setFridayFishOnly] = useState(false);
  const [fastingProtocol, setFastingProtocol] =
    useState<FastingProtocol>("none");
  const [fastingDays, setFastingDays] = useState<number[]>([]);
  const [hourByHour, setHourByHour] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kindMeta = getGoalKindMeta(goalKind);
  const detectedWeightLoss = goalKind === "health_weight";
  const detectedSavings = goalKind === "finance";
  const detectedEarning = goalKind === "income";
  const multiStep = Boolean(kindMeta.hasIntake);

  function applyKind(kind: GoalKind, userPicked = true) {
    setGoalKind(kind);
    if (userPicked) setKindTouched(true);
    const meta = getGoalKindMeta(kind);
    if (!plantTouched) setPlantType(meta.defaultPlant);
  }

  function syncKindFromText(nextTitle: string, nextDesc: string) {
    if (kindTouched) return;
    const suggested = suggestKindFromText(nextTitle, nextDesc);
    // Prefer explicit savings/weight keywords; keep general if weak signal
    if (suggested !== "general") applyKind(suggested, false);
  }

  useEffect(() => {
    if (!open) {
      setStep(1);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  function toProfile(): WeightLossProfile | null {
    const cw = parseFloat(currentWeight);
    const gw = parseFloat(goalWeight);
    const ageN = parseInt(age, 10);
    if (!cw || !gw || !ageN) return null;

    let height_cm: number;
    let current_weight_kg: number;
    let goal_weight_kg: number;
    let waist_cm: number | undefined;
    let hips_cm: number | undefined;
    let chest_cm: number | undefined;

    if (units === "imperial") {
      const feet = parseFloat(heightMajor) || 0;
      const inches = parseFloat(heightMinor) || 0;
      height_cm = inchesToCm(feet * 12 + inches);
      current_weight_kg = lbsToKg(cw);
      goal_weight_kg = lbsToKg(gw);
      if (waist) waist_cm = inchesToCm(parseFloat(waist));
      if (hips) hips_cm = inchesToCm(parseFloat(hips));
      if (chest) chest_cm = inchesToCm(parseFloat(chest));
    } else {
      height_cm = parseFloat(heightMajor);
      current_weight_kg = cw;
      goal_weight_kg = gw;
      if (waist) waist_cm = parseFloat(waist);
      if (hips) hips_cm = parseFloat(hips);
      if (chest) chest_cm = parseFloat(chest);
    }

    return {
      current_weight_kg,
      goal_weight_kg,
      height_cm,
      age: ageN,
      sex,
      activity_level: activity,
      waist_cm,
      hips_cm,
      chest_cm,
      units,
      diet_style: dietStyle,
      friday_fish_only: fridayFishOnly,
      fasting_protocol: fastingProtocol,
      fasting_days: fastingProtocol === "none" ? [] : fastingDays,
      hour_by_hour_schedule: hourByHour,
    };
  }

  function toggleFastingDay(day: number) {
    setFastingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setMetrics("");
    setDeadline(defaultDeadline);
    setGoalKind("general");
    setKindTouched(false);
    setCurrentWeight("");
    setGoalWeight("");
    setHeightMajor("");
    setHeightMinor("");
    setAge("");
    setActivity("sedentary");
    setWaist("");
    setHips("");
    setChest("");
    setDietStyle("balanced");
    setFridayFishOnly(false);
    setFastingProtocol("none");
    setFastingDays([]);
    setHourByHour(false);
    setSaveTarget("");
    setSaveAlready("0");
    setSaveCurrency("USD");
    setSavePurpose("general");
    setSaveCadence("daily");
    setEarnFocus("job");
    setEarnRole("");
    setEarnIncome("");
    setEarnCurrency("USD");
    setEarnHours("10");
    setEarnStatus("");
    setPlantType(DEFAULT_PLANT);
    setPlantTouched(false);
    setStep(1);
  }

  function toSavingsProfile(): SavingsProfile | null {
    const target = parseFloat(saveTarget);
    if (!target || target <= 0) return null;
    return {
      target_amount: target,
      already_saved: Math.max(0, parseFloat(saveAlready) || 0),
      currency: saveCurrency || "USD",
      purpose: savePurpose,
      cadence: saveCadence,
    };
  }

  function toEarningProfile(): EarningProfile {
    const income = parseFloat(earnIncome);
    const hours = parseFloat(earnHours);
    return {
      focus: earnFocus,
      target_role: earnRole.trim() || undefined,
      target_income:
        Number.isFinite(income) && income > 0 ? income : undefined,
      currency: earnCurrency || "USD",
      hours_per_week:
        Number.isFinite(hours) && hours > 0 ? hours : undefined,
      current_status: earnStatus.trim() || undefined,
    };
  }

  async function handleFinalSubmit() {
    setError(null);
    if (!title.trim()) {
      setError("Give your big goal a title.");
      setStep(1);
      return;
    }
    if (!deadline) {
      setError("Pick a deadline so we can schedule milestones.");
      setStep(1);
      return;
    }

    let health_profile: WeightLossProfile | undefined;
    let savings_profile: SavingsProfile | undefined;
    let earning_profile: EarningProfile | undefined;
    let category: GoalCategory = kindMeta.category;

    if (detectedWeightLoss) {
      const profile = toProfile();
      const validation = validateWeightLossProfile(profile ?? {});
      if (validation || !profile) {
        setError(validation || "Complete your body stats.");
        setStep(2);
        return;
      }
      health_profile = profile;
      category = "weight_loss";
    } else if (detectedEarning) {
      const profile = toEarningProfile();
      const validation = validateEarningProfile(profile);
      if (validation) {
        setError(validation);
        setStep(2);
        return;
      }
      earning_profile = profile;
      category = "income";
    } else if (detectedSavings) {
      const profile = toSavingsProfile();
      const validation = validateSavingsProfile(profile ?? {});
      if (validation || !profile) {
        setError(validation || "Enter your savings target.");
        setStep(2);
        return;
      }
      savings_profile = profile;
      category = "savings";
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline,
        success_metrics:
          metrics.trim() ||
          (health_profile
            ? `Reach ${
                units === "imperial"
                  ? `${Math.round(kgToLbs(health_profile.goal_weight_kg))} lb`
                  : `${health_profile.goal_weight_kg} kg`
              } with healthy habits`
            : earning_profile
              ? (() => {
                  const plan = buildEarningPlan(earning_profile, deadline);
                  return `${EARNING_FOCUS_LABELS[earning_profile.focus]} · ${plan.target_role} · ~${plan.weekly_actions} actions/week`;
                })()
              : savings_profile
                ? `Save ${formatMoneyAmount(savings_profile.target_amount, savings_profile.currency)} · daily ${formatMoneyAmount(
                    buildSavingsPlan(savings_profile, deadline).daily_save,
                    savings_profile.currency
                  )}`
                : undefined),
        category,
        health_profile,
        savings_profile,
        earning_profile,
        plant_type: plantType,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create goal");
    } finally {
      setLoading(false);
    }
  }

  function goNextFromStep1() {
    setError(null);
    if (!title.trim()) {
      setError("Give your big goal a title.");
      return;
    }
    if (!deadline) {
      setError("Pick a deadline.");
      return;
    }
    // Pre-fill amount if title has $500 etc.
    if (detectedSavings && !saveTarget) {
      const parsed = parseAmountFromText(`${title} ${description}`);
      if (parsed) setSaveTarget(String(parsed));
    }
    if (detectedEarning) {
      setEarnFocus(suggestEarningFocus(title, description));
      if (!earnRole.trim()) {
        // soft default from title
        const cleaned = title
          .replace(
            /^(i want to|want to|need to|get|find|land|start)\s+/i,
            ""
          )
          .trim();
        if (cleaned) setEarnRole(cleaned.slice(0, 80));
      }
    }
    if (multiStep) setStep(2);
    else void handleFinalSubmit();
  }

  const multiStepFlow = multiStep;

  function goNextFromStep2() {
    setError(null);
    if (detectedEarning) {
      const profile = toEarningProfile();
      const validation = validateEarningProfile(profile);
      if (validation) {
        setError(validation);
        return;
      }
      setStep(3);
      return;
    }
    if (detectedSavings) {
      const profile = toSavingsProfile();
      const validation = validateSavingsProfile(profile ?? {});
      if (validation || !profile) {
        setError(validation || "Enter a target amount.");
        return;
      }
      setStep(3);
      return;
    }
    const profile = toProfile();
    const validation = validateWeightLossProfile(profile ?? {});
    if (validation || !profile) {
      setError(validation || "Complete required fields.");
      return;
    }
    setStep(3);
  }

  const preview =
    detectedWeightLoss && step === 3
      ? (() => {
          const p = toProfile();
          return p ? buildWeightLossPlan(p, deadline) : null;
        })()
      : null;

  const savingsPreview =
    detectedSavings && step === 3
      ? (() => {
          const p = toSavingsProfile();
          return p ? buildSavingsPlan(p, deadline) : null;
        })()
      : null;

  const earningPreview =
    detectedEarning && step === 3
      ? buildEarningPlan(toEarningProfile(), deadline)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="card relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 1 && "Plant a big goal"}
              {step === 2 &&
                (detectedEarning
                  ? "Earning setup"
                  : detectedSavings
                    ? "Savings target"
                    : "Body stats & lifestyle")}
              {step === 3 &&
                (detectedEarning
                  ? "Your income action plan"
                  : detectedSavings
                    ? "Your clear save goals"
                    : "Your healthy targets")}
            </h2>
            <p className="text-sm text-muted">
              {step === 1 &&
                "Pick a type — Earn is for jobs/income; Save is for putting money aside."}
              {step === 2 &&
                (detectedEarning
                  ? "No savings amount required — we’ll build applications, outreach, and skills work."
                  : detectedSavings
                    ? "We’ll turn your big number into daily and weekly save goals."
                    : "We use these only to estimate calories, macros, water, and movement.")}
              {step === 3 &&
                (detectedEarning
                  ? "Review the weekly action pace, then generate your plan."
                  : detectedSavings
                    ? "Review the big goal and daily amount, then generate your plan."
                    : "Sustainable pace — no crash diets. Review, then generate your plan.")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-white/5"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators */}
        {multiStepFlow && (
          <div className="mb-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  step >= s ? "bg-accent" : "bg-white/10"
                )}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs text-muted">
                What kind of goal? *
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {GOAL_KINDS.map((id) => {
                  const meta = GOAL_KIND_META[id];
                  const on = goalKind === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyKind(id, true)}
                      className={cn(
                        "flex flex-col items-start gap-0.5 rounded-xl border px-2.5 py-2 text-left transition",
                        on
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border bg-black/20 text-muted hover:border-accent/30 hover:text-foreground",
                        meta.featured && !on && "border-accent/20"
                      )}
                    >
                      <span className="flex w-full items-center gap-1.5">
                        <span className="text-base leading-none">
                          {meta.emoji}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {meta.short}
                        </span>
                        {meta.featured && (
                          <span className="ml-auto rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                            Deep
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-[10px] leading-snug opacity-80">
                        {meta.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                {kindMeta.emoji}{" "}
                <span className="font-medium text-foreground">
                  {kindMeta.label}
                </span>
                {" — "}
                {kindMeta.blurb}
                {kindMeta.hasIntake
                  ? " Extra setup next for targets."
                  : " Plan generates right after this step."}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">Title *</label>
              <input
                className="input-field"
                value={title}
                onChange={(e) => {
                  const v = e.target.value;
                  setTitle(v);
                  syncKindFromText(v, description);
                  if (!plantTouched) {
                    setPlantType(
                      suggestPlantFromTitle(v) !== DEFAULT_PLANT
                        ? suggestPlantFromTitle(v)
                        : kindMeta.defaultPlant
                    );
                  }
                }}
                placeholder={kindMeta.placeholders.title}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Description</label>
              <textarea
                className="input-field min-h-[72px] resize-y"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  syncKindFromText(title, e.target.value);
                }}
                placeholder={kindMeta.placeholders.description}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Deadline *</label>
              <input
                type="date"
                className="input-field"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Success metrics (optional)
              </label>
              <input
                className="input-field"
                value={metrics}
                onChange={(e) => setMetrics(e.target.value)}
                placeholder={kindMeta.placeholders.metrics}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-muted">
                Plant to grow
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                {PLANT_TYPES.map((id) => {
                  const meta = PLANTS[id];
                  const on = plantType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPlantType(id);
                        setPlantTouched(true);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-center transition",
                        on
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border bg-black/20 text-muted hover:border-accent/30 hover:text-foreground"
                      )}
                      title={meta.blurb}
                    >
                      <span className="text-lg leading-none">{meta.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight">
                        {meta.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                {PLANTS[plantType].emoji} {PLANTS[plantType].blurb}
              </p>
            </div>

            {detectedWeightLoss && (
              <div className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-sm text-accent">
                <Scale className="mb-1 inline h-4 w-4" /> Weight &amp; body —
                next we&apos;ll collect stats for calories, macros, water, and
                movement.
              </div>
            )}
            {detectedSavings && (
              <div className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5 text-sm text-accent">
                <PiggyBank className="mb-1 inline h-4 w-4" /> Save &amp; budget
                — next we&apos;ll set your big $ target and daily save goals.
                <button
                  type="button"
                  className="mt-1.5 block text-xs underline opacity-90 hover:opacity-100"
                  onClick={() => applyKind("income", true)}
                >
                  Actually need a job or to earn income? Switch to Earn →
                </button>
              </div>
            )}
            {detectedEarning && (
              <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-300">
                <Briefcase className="mb-1 inline h-4 w-4" /> Earn &amp; get
                hired — next we&apos;ll set up job search / income actions (no
                savings total required).
                <button
                  type="button"
                  className="mt-1.5 block text-xs underline opacity-90 hover:opacity-100"
                  onClick={() => applyKind("finance", true)}
                >
                  Want a savings jar instead? Switch to Save →
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && detectedEarning && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-black/20 p-3 text-xs text-muted">
              <p className="font-medium text-foreground">How this works</p>
              <p className="mt-1">
                This is an{" "}
                <strong className="text-foreground">earning goal</strong> — get
                hired, land clients, or start getting paid. We plan daily{" "}
                <strong className="text-foreground">actions</strong> (applications,
                outreach, portfolio), not a savings amount.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted">
                What kind of earning goal? *
              </label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {(
                  Object.entries(EARNING_FOCUS_LABELS) as [
                    EarningFocus,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setEarnFocus(value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                      earnFocus === value
                        ? "border-sky-400/50 bg-sky-500/15 text-sky-200"
                        : "border-border text-muted hover:bg-white/5"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Target role / field / offer
              </label>
              <input
                className="input-field"
                value={earnRole}
                onChange={(e) => setEarnRole(e.target.value)}
                placeholder="e.g. Retail associate · Virtual assistant · First freelance client"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Where you are now (optional)
              </label>
              <input
                className="input-field"
                value={earnStatus}
                onChange={(e) => setEarnStatus(e.target.value)}
                placeholder="e.g. Unemployed · Switching careers · Part-time now"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  Income aim / month (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="input-field"
                  value={earnIncome}
                  onChange={(e) => setEarnIncome(e.target.value)}
                  placeholder="Leave blank if unsure"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Currency</label>
                <select
                  className="input-field"
                  value={earnCurrency}
                  onChange={(e) => setEarnCurrency(e.target.value)}
                >
                  {[
                    "USD",
                    "PHP",
                    "EUR",
                    "GBP",
                    "CAD",
                    "AUD",
                    "MXN",
                    "JPY",
                    "SGD",
                    "INR",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Hours you can invest / week
              </label>
              <input
                type="number"
                min={1}
                max={80}
                className="input-field"
                value={earnHours}
                onChange={(e) => setEarnHours(e.target.value)}
                placeholder="10"
              />
              <p className="mt-1 text-[11px] text-muted">
                Short deadlines (like 1 week) get denser application/outreach
                tasks.
              </p>
            </div>
          </div>
        )}

        {step === 2 && detectedSavings && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-black/20 p-3 text-xs text-muted">
              <p className="font-medium text-foreground">How this works</p>
              <p className="mt-1">
                You set one <strong className="text-foreground">big goal</strong>{" "}
                (total $). We show a clear{" "}
                <strong className="text-foreground">daily goal</strong> and
                weekly checkpoints so Today&apos;s wins always has a concrete
                dollar amount.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-medium text-sky-300 underline"
                onClick={() => {
                  applyKind("income", true);
                  setStep(2);
                }}
              >
                Not saving — I need to earn / get a job →
              </button>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                What is this for?
              </label>
              <select
                className="input-field"
                value={savePurpose}
                onChange={(e) =>
                  setSavePurpose(e.target.value as SavingsPurpose)
                }
              >
                {(
                  Object.entries(PURPOSE_LABELS) as [SavingsPurpose, string][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-muted">
                  Big goal — total to save *
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  className="input-field"
                  value={saveTarget}
                  onChange={(e) => setSaveTarget(e.target.value)}
                  placeholder="e.g. 2000"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Currency</label>
                <select
                  className="input-field"
                  value={saveCurrency}
                  onChange={(e) => setSaveCurrency(e.target.value)}
                >
                  {[
                    "USD",
                    "PHP",
                    "EUR",
                    "GBP",
                    "CAD",
                    "AUD",
                    "MXN",
                    "JPY",
                    "SGD",
                    "HKD",
                    "INR",
                  ].map((c) => (
                    <option key={c} value={c}>
                      {c === "PHP" ? "PHP (₱)" : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Already saved toward this
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input-field"
                value={saveAlready}
                onChange={(e) => setSaveAlready(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                Prefer to transfer
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["daily", "Daily"],
                    ["weekly", "Weekly"],
                    ["biweekly", "Paydays"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "rounded-xl border px-2 py-2 text-xs font-medium",
                      saveCadence === value
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-muted hover:bg-white/5"
                    )}
                    onClick={() => setSaveCadence(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                Daily goals still appear on the plan either way — this chooses
                the main transfer style.
              </p>
            </div>
          </div>
        )}

        {step === 2 && detectedWeightLoss && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["metric", "imperial"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm capitalize",
                    units === u
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-muted hover:bg-white/5"
                  )}
                  onClick={() => setUnits(u)}
                >
                  {u === "metric" ? "kg / cm" : "lb / ft-in"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Current weight ({units === "metric" ? "kg" : "lb"}) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="input-field"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder={units === "metric" ? "82" : "180"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Goal weight ({units === "metric" ? "kg" : "lb"}) *
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  className="input-field"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  placeholder={units === "metric" ? "72" : "160"}
                />
              </div>
            </div>

            {units === "metric" ? (
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={heightMajor}
                  onChange={(e) => setHeightMajor(e.target.value)}
                  placeholder="170"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Height (ft) *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={heightMajor}
                    onChange={(e) => setHeightMajor(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={heightMinor}
                    onChange={(e) => setHeightMinor(e.target.value)}
                    placeholder="7"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Age *</label>
                <input
                  type="number"
                  min={16}
                  max={100}
                  className="input-field"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="32"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">
                  Sex (for estimate) *
                </label>
                <select
                  className="input-field"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as Sex)}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other / prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-xs text-muted">
                <Activity className="h-3.5 w-3.5" /> Activity level *
              </label>
              <select
                className="input-field"
                value={activity}
                onChange={(e) =>
                  setActivity(e.target.value as ActivityLevel)
                }
              >
                {ACTIVITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {(activity === "sedentary" || activity === "light") && (
                <p className="mt-1.5 text-xs text-sky-300">
                  We&apos;ll recommend no-equipment home workouts and walks to
                  gently raise activity — not intense gym plans.
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1 text-xs text-muted">
                <Ruler className="h-3.5 w-3.5" /> Optional measurements (
                {units === "metric" ? "cm" : "inches"})
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  className="input-field"
                  placeholder="Waist"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder="Hips"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                />
                <input
                  type="number"
                  className="input-field"
                  placeholder="Chest"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted">
                Diet / meal style
              </label>
              <select
                className="input-field"
                value={dietStyle}
                onChange={(e) => setDietStyle(e.target.value as DietStyle)}
              >
                {(
                  Object.entries(DIET_STYLE_LABELS) as [DietStyle, string][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">
                Shapes meal recommendations and macro tilt (keto/carnivore go
                lower-carb).
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 accent-emerald-500"
                checked={fridayFishOnly}
                onChange={(e) => setFridayFishOnly(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">
                  Fridays: fish only (no land meat)
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Religious or personal observance — Fridays use fish/seafood or
                  plant proteins.
                </span>
              </span>
            </label>

            <div>
              <label className="mb-1 block text-xs text-muted">
                Fasting schedule (optional)
              </label>
              <select
                className="input-field"
                value={fastingProtocol}
                onChange={(e) => {
                  const v = e.target.value as FastingProtocol;
                  setFastingProtocol(v);
                  if (v === "none") setFastingDays([]);
                  else if (fastingDays.length === 0) setFastingDays([3]); // default Wed
                }}
              >
                {(
                  Object.entries(FASTING_PROTOCOL_LABELS) as [
                    FastingProtocol,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {fastingProtocol !== "none" && (
                <div className="mt-2">
                  <p className="mb-1.5 text-[11px] text-muted">
                    Fasting days
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_LABELS.map((label, i) => {
                      const on = fastingDays.includes(i);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleFastingDay(i)}
                          className={cn(
                            "rounded-lg border px-2 py-1 text-[11px]",
                            on
                              ? "border-accent bg-accent/15 text-accent"
                              : "border-border text-muted hover:bg-white/5"
                          )}
                        >
                          {label.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 accent-emerald-500"
                checked={hourByHour}
                onChange={(e) => setHourByHour(e.target.checked)}
              />
              <span>
                <span className="font-medium text-foreground">
                  Hour-by-hour day schedule
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  Adds timed tasks (wake, meals, window open/close, sleep) —
                  great for fasting days or structured eating.
                </span>
              </span>
            </label>
          </div>
        )}

        {step === 3 && earningPreview && (
          <div className="space-y-3">
            <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3">
              <p className="text-xs text-sky-300">
                {EARNING_FOCUS_LABELS[earningPreview.focus]}
              </p>
              <p className="text-xl font-bold text-foreground">
                {earningPreview.target_role}
              </p>
              <p className="mt-1 text-xs text-muted">
                {earningPreview.days_total} day sprint · ~{" "}
                {earningPreview.hours_per_week}h / week
                {earningPreview.target_income != null
                  ? ` · aim ${formatMoneyAmount(
                      earningPreview.target_income,
                      earningPreview.currency
                    )}/mo`
                  : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat
                label="Weekly actions"
                value={`~${earningPreview.weekly_actions}`}
                sub="apps / outreach"
              />
              <Stat
                label="Daily focus"
                value="Act"
                sub="not scroll"
              />
            </div>
            <p className="rounded-xl border border-border bg-black/20 px-3 py-2 text-xs text-muted">
              {earningPreview.daily_focus}
            </p>
            <ul className="space-y-1 text-xs text-muted">
              {earningPreview.tips.slice(0, 3).map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted/80">
              {earningPreview.disclaimer}
            </p>
          </div>
        )}

        {step === 3 && savingsPreview && (
          <div className="space-y-3">
            <div className="rounded-xl border border-accent/25 bg-accent/10 p-3">
              <p className="text-xs text-accent">Big goal</p>
              <p className="text-2xl font-bold text-foreground">
                {formatMoneyAmount(
                  savingsPreview.target_amount,
                  savingsPreview.currency
                )}
              </p>
              <p className="mt-1 text-xs text-muted">
                Need{" "}
                {formatMoneyAmount(
                  savingsPreview.remaining,
                  savingsPreview.currency
                )}{" "}
                more in {savingsPreview.days_total} days ·{" "}
                {PURPOSE_LABELS[savingsPreview.purpose]}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Daily goal"
                value={formatMoneyAmount(
                  savingsPreview.daily_save,
                  savingsPreview.currency
                )}
                sub="every day"
              />
              <Stat
                label="Weekly goal"
                value={formatMoneyAmount(
                  savingsPreview.weekly_save,
                  savingsPreview.currency
                )}
                sub="per week"
              />
              <Stat
                label="Monthly"
                value={formatMoneyAmount(
                  savingsPreview.monthly_save,
                  savingsPreview.currency
                )}
                sub="pace"
              />
            </div>
            <ul className="space-y-1 text-xs text-muted">
              {savingsPreview.tips.slice(0, 3).map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted/80">
              {savingsPreview.disclaimer}
            </p>
          </div>
        )}

        {step === 3 && preview && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat
                label="Daily calories"
                value={`${preview.daily_calories}`}
                sub="kcal approx"
              />
              <Stat
                label="Protein"
                value={`${preview.macros.protein_g}g`}
                sub="per day"
              />
              <Stat
                label="Carbs"
                value={`${preview.macros.carbs_g}g`}
                sub="per day"
              />
              <Stat
                label="Fat"
                value={`${preview.macros.fat_g}g`}
                sub="per day"
              />
            </div>

            <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-sky-300">
                <Droplets className="h-4 w-4" /> Water goal
              </p>
              <p className="mt-1 text-lg font-semibold">
                {preview.water_liters} L{" "}
                <span className="text-sm font-normal text-muted">
                  (~{preview.water_glasses} glasses of 250 ml)
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-border bg-black/20 p-3 text-sm">
              <p className="text-xs text-muted">
                TDEE ~{preview.tdee} · BMR ~{preview.bmr} · BMI{" "}
                {preview.bmi_current} → {preview.bmi_goal}
              </p>
              <p className="mt-1 text-muted">
                Healthy pace ~{preview.weekly_loss_kg} kg/week · rough timeline ~
                {preview.weeks_estimated} weeks
              </p>
            </div>

            {preview.meal_plan && (
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-3">
                <p className="text-sm font-medium text-accent">
                  {preview.meal_plan.label} meal ideas
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {preview.meal_plan.summary}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {preview.meal_plan.meals.slice(0, 3).map((m) => (
                    <li key={m.label}>
                      • <span className="text-foreground">{m.label}:</span>{" "}
                      {m.ideas}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {preview.recommend_home_workouts && (
              <div className="rounded-xl border border-accent/20 bg-accent/10 p-3">
                <p className="text-sm font-medium text-accent">
                  Home movement (no equipment)
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {preview.home_workouts.slice(0, 4).map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="space-y-1 text-xs text-muted">
              {preview.healthy_notes.slice(0, 4).map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
            <p className="text-[11px] text-muted/80">{preview.disclaimer}</p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            {step > 1 ? (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
            )}
          </div>

          {step === 1 && (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={goNextFromStep1}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Growing plan…
                </>
              ) : multiStepFlow ? (
                <>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate plan
                </>
              )}
            </button>
          )}

          {step === 2 && (
            <button type="button" className="btn-primary" onClick={goNextFromStep2}>
              {detectedEarning ? "See action plan" : "See targets"}
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => void handleFinalSubmit()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {detectedEarning
                    ? "Building earning plan…"
                    : detectedSavings
                      ? "Building savings plan…"
                      : "Building healthy plan…"}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate plan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-black/25 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-lg font-bold text-accent">{value}</p>
      {sub && <p className="text-[10px] text-muted">{sub}</p>}
    </div>
  );
}

