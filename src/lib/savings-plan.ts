/**
 * Savings goal planner — clear big target + daily/weekly/monthly micro-goals.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { BusySlot, GeneratedPlan } from "./types";

export type SavingsPurpose =
  | "emergency"
  | "vacation"
  | "home"
  | "car"
  | "debt"
  | "gift"
  | "education"
  | "general";

export type SavingsProfile = {
  target_amount: number;
  already_saved: number;
  currency?: string;
  purpose?: SavingsPurpose;
  /** Preferred transfer rhythm for task titles */
  cadence?: "daily" | "weekly" | "biweekly";
};

export type SavingsPlanSummary = {
  target_amount: number;
  already_saved: number;
  remaining: number;
  currency: string;
  purpose: SavingsPurpose;
  cadence: "daily" | "weekly" | "biweekly";
  days_total: number;
  daily_save: number;
  weekly_save: number;
  monthly_save: number;
  biweekly_save: number;
  /** Milestone checkpoints: cumulative $ by week */
  checkpoints: { week: number; cumulative: number; label: string }[];
  tips: string[];
  disclaimer: string;
};

export const PURPOSE_LABELS: Record<SavingsPurpose, string> = {
  emergency: "Emergency fund",
  vacation: "Vacation / travel",
  home: "Home / rent deposit",
  car: "Car / transport",
  debt: "Debt payoff",
  gift: "Gift / celebration",
  education: "Education",
  general: "General savings",
};

const SAVINGS_PATTERNS = [
  /sav(e|ing|ings)/i,
  /emergency\s*fund/i,
  /rainy\s*day/i,
  /put\s*away/i,
  /nest\s*egg/i,
  /down\s*payment/i,
  /pay\s*off/i,
  /debt\s*(free|pay)/i,
  /budget/i,
  /\$\s*\d+/,
  /\d+\s*(dollars?|bucks|usd|eur|gbp)/i,
  /vacation\s*fund/i,
];

/** Pure “earn money / get a job” language — not a savings jar */
const EARNING_NOT_SAVINGS = [
  /\bearn(ing)?\b/i,
  /\bget\s+(a\s+)?job\b/i,
  /\bfind\s+(a\s+)?job\b/i,
  /\bmake\s+money\b/i,
  /\bget\s+paid\b/i,
  /\bincome\b/i,
  /\bhired\b/i,
  /\bfreelance\b/i,
  /\bside\s*hustle\b/i,
];

export function isSavingsGoal(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  // Don't treat job/income goals as savings just because they mention money
  if (EARNING_NOT_SAVINGS.some((p) => p.test(text))) {
    // Explicit save/debt language can still win
    if (
      !/sav(e|ing|ings)|emergency\s*fund|debt|pay\s*off|nest\s*egg|budget|down\s*payment/i.test(
        text
      )
    ) {
      return false;
    }
  }
  return SAVINGS_PATTERNS.some((p) => p.test(text));
}

export function formatMoneyAmount(
  amount: number,
  currency = "USD"
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${Math.round(amount * 100) / 100}`;
  }
}

export function validateSavingsProfile(
  p: Partial<SavingsProfile>
): string | null {
  if (
    p.target_amount == null ||
    !Number.isFinite(p.target_amount) ||
    p.target_amount <= 0
  ) {
    return "Enter a target amount greater than zero.";
  }
  if (p.target_amount > 50_000_000) {
    return "That target looks unrealistically high — check the number.";
  }
  const saved = p.already_saved ?? 0;
  if (saved < 0) return "Already saved can’t be negative.";
  if (saved >= p.target_amount) {
    return "Already saved is at or above the target — raise the goal or lower saved.";
  }
  return null;
}

export function buildSavingsPlan(
  profile: SavingsProfile,
  deadlineISO: string
): SavingsPlanSummary {
  const currency = profile.currency || "USD";
  const purpose = profile.purpose || "general";
  const cadence = profile.cadence || "daily";
  const target = Math.round(profile.target_amount * 100) / 100;
  const already = Math.max(0, Math.round((profile.already_saved || 0) * 100) / 100);
  const remaining = Math.max(0, Math.round((target - already) * 100) / 100);

  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = parseISO(deadlineISO);
  const days_total = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const weeks = Math.max(1, days_total / 7);
  const months = Math.max(1, days_total / 30.4);

  // Round money targets up slightly so user hits goal on time
  const daily_save = Math.ceil((remaining / days_total) * 100) / 100;
  const weekly_save = Math.ceil((remaining / weeks) * 100) / 100;
  const monthly_save = Math.ceil((remaining / months) * 100) / 100;
  const biweekly_save = Math.ceil((remaining / Math.max(1, days_total / 14)) * 100) / 100;

  const weekCount = Math.min(12, Math.max(2, Math.ceil(days_total / 7)));
  const checkpoints: SavingsPlanSummary["checkpoints"] = [];
  for (let w = 1; w <= weekCount; w++) {
    const frac = w / weekCount;
    const cumulative =
      Math.round((already + remaining * frac) * 100) / 100;
    checkpoints.push({
      week: w,
      cumulative: Math.min(target, cumulative),
      label:
        w === weekCount
          ? `Finish line — reach ${formatMoneyAmount(target, currency)}`
          : `Week ${w} checkpoint — ~${formatMoneyAmount(cumulative, currency)} total`,
    });
  }

  const tips = [
    `Primary daily goal: put aside ${formatMoneyAmount(daily_save, currency)} every day (or ${formatMoneyAmount(weekly_save, currency)} once a week).`,
    "Automate a transfer on payday if you can — then check it off here.",
    "Track every save, even small ones — momentum beats perfect amounts.",
    "A no-spend day is still progress if you move that money to savings.",
  ];
  if (purpose === "debt") {
    tips.push("Pay minimums first, then direct the daily amount to the target debt.");
  }
  if (purpose === "emergency") {
    tips.push("Park emergency cash in an easy-access savings account.");
  }
  if (daily_save > 50) {
    tips.push(
      "Daily amount is high — consider weekly lump transfers if that fits your pay cycle better."
    );
  }

  return {
    target_amount: target,
    already_saved: already,
    remaining,
    currency,
    purpose,
    cadence,
    days_total,
    daily_save,
    weekly_save,
    monthly_save,
    biweekly_save,
    checkpoints,
    tips,
    disclaimer:
      "Planning estimates only. Not financial advice. Adjust if income or bills change.",
  };
}

type PlanTask = {
  title: string;
  scheduled_date: string;
  notes?: string;
};

function money(n: number, currency: string) {
  return formatMoneyAmount(n, currency);
}

/**
 * Dense savings plan: clear weekly milestones + daily save goals.
 */
export function generateSavingsPlan(
  profile: SavingsProfile,
  deadline: string,
  busySlots?: BusySlot[]
): { plan: GeneratedPlan; summary: SavingsPlanSummary } {
  void busySlots;
  const summary = buildSavingsPlan(profile, deadline);
  const { currency, daily_save, weekly_save, remaining, target_amount, already_saved } =
    summary;

  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = parseISO(deadline);
  const rawDays = Math.max(14, differenceInCalendarDays(end, start) + 1);
  // Cap dense daily generation at 90 days for performance
  const totalDays = Math.min(90, rawDays);
  const weekCount = Math.max(2, Math.ceil(totalDays / 7));

  const milestones: GeneratedPlan["milestones"] = [];
  let runningSaved = already_saved;

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(start, w * 7);
    const daysInWeek = Math.min(7, totalDays - w * 7);
    if (daysInWeek <= 0) break;

    const weekTarget = Math.min(
      remaining - (runningSaved - already_saved),
      Math.round(weekly_save * (daysInWeek / 7) * 100) / 100
    );
    const endOfWeekSaved = Math.min(
      target_amount,
      Math.round((runningSaved + weekTarget) * 100) / 100
    );

    const weekTasks: PlanTask[] = [];

    for (let d = 0; d < daysInWeek; d++) {
      const day = addDays(weekStart, d);
      const iso = format(day, "yyyy-MM-dd");
      const dayIndex = w * 7 + d;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      // Primary daily goal — always clear dollar amount
      if (summary.cadence === "weekly" && day.getDay() === 1) {
        weekTasks.push({
          title: `Save ${money(weekly_save, currency)} this week (transfer today)`,
          scheduled_date: iso,
          notes: `Weekly lump · goal total by week end ~${money(endOfWeekSaved, currency)}`,
        });
      } else if (summary.cadence === "biweekly" && dayIndex % 14 === 0) {
        weekTasks.push({
          title: `Save ${money(summary.biweekly_save, currency)} (payday transfer)`,
          scheduled_date: iso,
          notes: `Biweekly · remaining overall ${money(remaining, currency)}`,
        });
      } else if (summary.cadence === "daily" || day.getDay() !== 0) {
        // Skip pure Sunday on daily cadence for rest — use Saturday catch-up instead
        if (!(summary.cadence === "daily" && day.getDay() === 0)) {
          weekTasks.push({
            title: `Daily goal: save ${money(daily_save, currency)}`,
            scheduled_date: iso,
            notes: `Toward ${money(target_amount, currency)} total · ${PURPOSE_LABELS[summary.purpose]}`,
          });
        }
      }

      // Rotating supporting habits
      const support = [
        {
          title: "Log today’s spending (2 minutes)",
          notes: "Awareness protects the save amount",
        },
        {
          title: isWeekend
            ? "No-spend or low-spend stretch today"
            : "Skip one optional purchase · move that $ to savings",
          notes: "Even $5 counts when it becomes a habit",
        },
        {
          title: "Check balance / confirm transfer went through",
          notes: "Trust but verify automation",
        },
        {
          title: "Protect the goal — fun money only after save",
          notes: "Pay yourself first",
        },
      ];
      if (dayIndex % 2 === 1) {
        const s = support[dayIndex % support.length];
        weekTasks.push({
          title: s.title,
          scheduled_date: iso,
          notes: s.notes,
        });
      }
    }

    // Monday: week intention
    const mon = format(weekStart, "yyyy-MM-dd");
    weekTasks.push({
      title: `Week ${w + 1} goal: add ~${money(weekTarget, currency)} (→ ~${money(endOfWeekSaved, currency)} total)`,
      scheduled_date: mon,
      notes: `Clear checkpoint · ${PURPOSE_LABELS[summary.purpose]} · remaining after this week ~${money(Math.max(0, target_amount - endOfWeekSaved), currency)}`,
    });

    // Mid-week: progress check
    if (daysInWeek >= 4) {
      weekTasks.push({
        title: `Mid-week check: still on track for ${money(endOfWeekSaved, currency)}?`,
        scheduled_date: format(addDays(weekStart, 3), "yyyy-MM-dd"),
        notes: "If behind, add a small catch-up transfer",
      });
    }

    // Weekend: weekly review
    const reviewDay = format(addDays(weekStart, Math.min(6, daysInWeek - 1)), "yyyy-MM-dd");
    weekTasks.push({
      title: `Weekly money review: mark ${money(endOfWeekSaved, currency)} checkpoint`,
      scheduled_date: reviewDay,
      notes: `Update saved total · celebrate any amount · plan next week’s ${money(weekly_save, currency)}`,
    });

    // First week setup tasks
    if (w === 0) {
      weekTasks.unshift(
        {
          title: `Big goal: reach ${money(target_amount, currency)} by deadline`,
          scheduled_date: mon,
          notes: `Already have ${money(already_saved, currency)} · need ${money(remaining, currency)} more`,
        },
        {
          title: "Open or name a savings bucket for this goal",
          scheduled_date: mon,
          notes: PURPOSE_LABELS[summary.purpose],
        },
        {
          title: `Set up auto-transfer of ${money(summary.cadence === "weekly" ? weekly_save : daily_save, currency)} (${summary.cadence})`,
          scheduled_date: mon,
          notes: "Automation makes daily goals easier",
        }
      );
    }

    // Sort by date
    weekTasks.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

    const phase =
      w === 0
        ? "Launch"
        : w < 3
          ? "Build the habit"
          : w < weekCount - 1
            ? "Stay consistent"
            : "Finish line";

    milestones.push({
      title: `Week ${w + 1} — ${phase}: ~${money(endOfWeekSaved, currency)} total`,
      target_date: format(addDays(weekStart, daysInWeek - 1), "yyyy-MM-dd"),
      tasks: weekTasks,
    });

    runningSaved = endOfWeekSaved;
  }

  return {
    plan: {
      milestones,
      savings_summary: summary,
    },
    summary,
  };
}

/** Live progress math for an existing profile + optional current saved override */
export function savingsPace(
  summary: SavingsPlanSummary,
  currentSaved?: number
): {
  saved: number;
  remaining: number;
  pct: number;
  onTrackDaily: number;
} {
  const saved = currentSaved ?? summary.already_saved;
  const remaining = Math.max(0, summary.target_amount - saved);
  const pct =
    summary.target_amount > 0
      ? Math.min(100, Math.round((saved / summary.target_amount) * 100))
      : 0;
  return {
    saved,
    remaining,
    pct,
    onTrackDaily: summary.daily_save,
  };
}

export function parseAmountFromText(text: string): number | null {
  const m = text.match(
    /(?:\$|usd\s*)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(?:k\b)?/i
  );
  if (!m) return null;
  let n = parseFloat(m[1].replace(/,/g, ""));
  if (/k\b/i.test(m[0]) || /\d+\s*k\b/i.test(text)) n *= 1000;
  return Number.isFinite(n) ? n : null;
}
