/**
 * Earning / income goals — job search, freelancing, side hustles, raises.
 * Not a savings jar: action plan toward getting paid.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { BusySlot, GeneratedPlan } from "./types";
import { formatMoneyAmount } from "./savings-plan";

export type EarningFocus =
  | "job"
  | "freelance"
  | "side_hustle"
  | "raise"
  | "business";

export type EarningProfile = {
  focus: EarningFocus;
  /** Role, field, or product you’re aiming for */
  target_role?: string;
  /** Optional monthly income goal (not required) */
  target_income?: number;
  currency?: string;
  /** Hours you can invest per week */
  hours_per_week?: number;
  /** e.g. unemployed, employed part-time, career switch */
  current_status?: string;
};

export type EarningPlanSummary = {
  focus: EarningFocus;
  target_role: string;
  target_income: number | null;
  currency: string;
  hours_per_week: number;
  current_status: string;
  days_total: number;
  /** Suggested outreach / applications per week */
  weekly_actions: number;
  daily_focus: string;
  tips: string[];
  disclaimer: string;
};

export const EARNING_FOCUS_LABELS: Record<EarningFocus, string> = {
  job: "Get a job / hired",
  freelance: "Freelance / clients",
  side_hustle: "Side hustle income",
  raise: "Raise or promotion",
  business: "Launch / grow a business",
};

const EARNING_PATTERNS = [
  /\bearn(ing)?\b/i,
  /\bincome\b/i,
  /\bget\s+(a\s+)?job\b/i,
  /\bfind\s+(a\s+)?job\b/i,
  /\bhired\b/i,
  /\bemploy(ed|ment)\b/i,
  /\bsalary\b/i,
  /\bpaycheck\b/i,
  /\bfreelance\b/i,
  /\bclient(s)?\b/i,
  /\bside\s*hustle\b/i,
  /\bget\s+paid\b/i,
  /\bmake\s+money\b/i,
  /\bstart\s+earn/i,
  /\bjob\s+search\b/i,
  /\binterview\b/i,
  /\bresume\b/i,
  /\bcv\b/i,
  /\bapplication(s)?\b/i,
];

/** Savings-style words that mean “put money aside,” not earn */
const SAVINGS_OVERRIDE = [
  /\bsave\b/i,
  /\bsaving(s)?\b/i,
  /\bemergency\s*fund\b/i,
  /\bdebt\b/i,
  /\bpay\s*off\b/i,
  /\bnest\s*egg\b/i,
  /\bdown\s*payment\b/i,
  /\bbudget\b/i,
];

export function isEarningGoal(title: string, description = ""): boolean {
  const text = `${title} ${description}`;
  if (SAVINGS_OVERRIDE.some((p) => p.test(text))) return false;
  return EARNING_PATTERNS.some((p) => p.test(text));
}

export function suggestEarningFocus(
  title: string,
  description = ""
): EarningFocus {
  const t = `${title} ${description}`.toLowerCase();
  if (/freelance|client|gig|contract/.test(t)) return "freelance";
  if (/side\s*hustle|extra\s*cash|nights?\s*and\s*weekends/.test(t))
    return "side_hustle";
  if (/raise|promot|salary increase|pay rise/.test(t)) return "raise";
  if (/business|startup|company|product launch|store/.test(t)) return "business";
  return "job";
}

export function validateEarningProfile(
  p: Partial<EarningProfile>
): string | null {
  if (!p.focus) return "Pick what kind of earning goal this is.";
  if (p.target_income != null && p.target_income < 0) {
    return "Income target can’t be negative (leave blank if unsure).";
  }
  if (
    p.hours_per_week != null &&
    (p.hours_per_week < 1 || p.hours_per_week > 80)
  ) {
    return "Hours per week should be between 1 and 80.";
  }
  return null;
}

export function buildEarningPlan(
  profile: EarningProfile,
  deadlineISO: string
): EarningPlanSummary {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = parseISO(deadlineISO);
  const days_total = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const hours = Math.min(40, Math.max(3, profile.hours_per_week || 10));
  const weeks = Math.max(1, days_total / 7);

  // Intensive short sprints vs longer campaigns
  let weekly_actions: number;
  if (days_total <= 10) {
    weekly_actions = profile.focus === "job" ? 15 : 10;
  } else if (days_total <= 21) {
    weekly_actions = profile.focus === "job" ? 12 : 8;
  } else {
    weekly_actions = profile.focus === "job" ? 8 : 5;
  }
  // Scale slightly by available hours
  weekly_actions = Math.max(
    3,
    Math.round(weekly_actions * Math.min(1.4, hours / 10))
  );

  const role =
    profile.target_role?.trim() ||
    (profile.focus === "job"
      ? "a role that fits your skills"
      : profile.focus === "freelance"
        ? "your first paying clients"
        : EARNING_FOCUS_LABELS[profile.focus]);

  const currency = profile.currency || "USD";
  const income =
    profile.target_income && profile.target_income > 0
      ? profile.target_income
      : null;

  const daily_focus =
    profile.focus === "job"
      ? "Applications, outreach, and interview prep — not endless scrolling"
      : profile.focus === "freelance"
        ? "Offers, proposals, and portfolio proof that wins clients"
        : profile.focus === "side_hustle"
          ? "Ship small offers and talk to real buyers"
          : profile.focus === "raise"
            ? "Document impact and schedule the money conversation"
            : "Validate demand and land the first paying customer";

  const tips = [
    `Aim for ~${weekly_actions} meaningful actions this week (applications, pitches, or outreach — not passive browsing).`,
    `Block ~${hours}h/week for focused work on this goal.`,
    "Volume + follow-up beats perfect resumes sitting in a drafts folder.",
    "Track every application/pitch so you can improve the funnel.",
  ];
  if (income) {
    tips.push(
      `Optional income aim: ${formatMoneyAmount(income, currency)}/mo — useful as a filter for roles/offers.`
    );
  }
  if (days_total <= 10) {
    tips.push(
      "Short deadline: prioritize applications and conversations over polishing for days."
    );
  }

  return {
    focus: profile.focus,
    target_role: role,
    target_income: income,
    currency,
    hours_per_week: hours,
    current_status: profile.current_status?.trim() || "",
    days_total,
    weekly_actions,
    daily_focus,
    tips,
    disclaimer:
      "Action plan only — not career or financial advice. Adjust pace to your energy and local job market.",
  };
}

type PlanTask = {
  title: string;
  scheduled_date: string;
  notes?: string;
};

/**
 * Dense earning plan: milestones + daily actions toward getting paid.
 */
export function generateEarningPlan(
  profile: EarningProfile,
  deadline: string,
  busySlots?: BusySlot[]
): { plan: GeneratedPlan; summary: EarningPlanSummary } {
  void busySlots;
  const summary = buildEarningPlan(profile, deadline);
  const { focus, target_role, weekly_actions, hours_per_week, target_income, currency } =
    summary;

  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const end = parseISO(deadline);
  const totalDays = Math.min(
    60,
    Math.max(7, differenceInCalendarDays(end, start) + 1)
  );
  const weekCount = Math.max(1, Math.ceil(totalDays / 7));
  const dailyActions = Math.max(
    1,
    Math.ceil(weekly_actions / 6) // skip pure rest day pacing
  );

  const incomeNote =
    target_income != null
      ? `Aim ~${formatMoneyAmount(target_income, currency)}/mo`
      : "Income number optional — focus on first offer";

  const roleTasks = (dayIndex: number, iso: string): PlanTask[] => {
    const tasks: PlanTask[] = [];
    if (focus === "job") {
      const pool = [
        {
          title: `Submit ${dailyActions}+ quality application(s) for ${target_role}`,
          notes: `${incomeNote} · track company + date`,
        },
        {
          title: "Tailor resume bullet points to one job description",
          notes: "Mirror 3–5 keywords honestly",
        },
        {
          title: "Send 2 warm outreach messages (ex-coworker, friend, alumni)",
          notes: "Ask for a 15-min chat, not a job",
        },
        {
          title: "Practice one interview answer out loud (STAR story)",
          notes: "Record yourself if you can",
        },
        {
          title: "Follow up on applications sent 5+ days ago",
          notes: "Short, polite, value-forward",
        },
        {
          title: "Update LinkedIn / portfolio with one concrete win",
          notes: "Results > responsibilities",
        },
        {
          title: "Research 3 companies you’d actually want to join",
          notes: "Note culture, pay band signals, referrals",
        },
      ];
      const p = pool[dayIndex % pool.length];
      tasks.push({ ...p, scheduled_date: iso });
      if (dayIndex % 2 === 0) {
        tasks.push({
          title: "Block focused job-search time (no social media)",
          scheduled_date: iso,
          notes: `Protect ~${Math.max(1, Math.round(hours_per_week / 5))}h today`,
        });
      }
    } else if (focus === "freelance") {
      const pool = [
        {
          title: "Send 2 proposals / pitches with a clear offer + price",
          notes: incomeNote,
        },
        {
          title: "Publish or refresh one portfolio proof piece",
          notes: "Before/after, case study, or sample",
        },
        {
          title: "Message 3 potential clients with a specific help offer",
          notes: "Problem → outcome → soft CTA",
        },
        {
          title: "Set or refine your starter package price",
          notes: "Simple one-pager beats a 12-page proposal",
        },
        {
          title: "Ask past contacts for one intro or testimonial",
          notes: "Social proof closes deals",
        },
        {
          title: "Follow up on every open pitch",
          notes: "Most yeses come after the second nudge",
        },
      ];
      const p = pool[dayIndex % pool.length];
      tasks.push({ ...p, scheduled_date: iso });
    } else if (focus === "side_hustle") {
      const pool = [
        {
          title: "Talk to 2 people who might buy (or know buyers)",
          notes: "Validate before building more",
        },
        {
          title: "Ship one tiny sellable piece of work today",
          notes: "Listing, sample, demo, menu, draft offer",
        },
        {
          title: "Post or list your offer where buyers already look",
          notes: "Marketplace, social, local board",
        },
        {
          title: "Track time + money — treat it like a mini business",
          notes: incomeNote,
        },
        {
          title: "Improve the offer based on one piece of feedback",
          notes: "Speed over perfection",
        },
      ];
      const p = pool[dayIndex % pool.length];
      tasks.push({ ...p, scheduled_date: iso });
    } else if (focus === "raise") {
      const pool = [
        {
          title: "Log one concrete win with metric or impact",
          notes: "Build a raise brief",
        },
        {
          title: "Research market pay for your role (2 sources)",
          notes: incomeNote,
        },
        {
          title: "Draft the raise conversation script (ask + evidence)",
          notes: "Practice once out loud",
        },
        {
          title: "Schedule or request a career/comp conversation",
          notes: "Calendar > waiting for the perfect moment",
        },
        {
          title: "Deliver visible value on a priority project",
          notes: "Timing helps the ask land",
        },
      ];
      const p = pool[dayIndex % pool.length];
      tasks.push({ ...p, scheduled_date: iso });
    } else {
      // business
      const pool = [
        {
          title: "Talk to 2 potential customers about the problem",
          notes: "Listen more than pitch",
        },
        {
          title: "Ship or improve one piece of the MVP/offer",
          notes: incomeNote,
        },
        {
          title: "Write a one-sentence value prop + who it’s for",
          notes: "Clarity sells",
        },
        {
          title: "Reach out to 3 people who could become first users",
          notes: "Warm network first",
        },
        {
          title: "Track one leading metric (signups, demos, sales)",
          notes: "Decide tomorrow’s action from today’s numbers",
        },
      ];
      const p = pool[dayIndex % pool.length];
      tasks.push({ ...p, scheduled_date: iso });
    }
    return tasks;
  };

  const milestones: GeneratedPlan["milestones"] = [];

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addDays(start, w * 7);
    const daysInWeek = Math.min(7, totalDays - w * 7);
    if (daysInWeek <= 0) break;

    const weekTasks: PlanTask[] = [];
    const mon = format(weekStart, "yyyy-MM-dd");

    weekTasks.push({
      title:
        w === 0
          ? `Week ${w + 1}: clarify offer for ${target_role} · ~${weekly_actions} actions`
          : `Week ${w + 1}: hit ~${weekly_actions} outreach/applications for ${target_role}`,
      scheduled_date: mon,
      notes: `${EARNING_FOCUS_LABELS[focus]} · ${incomeNote}`,
    });

    if (w === 0) {
      weekTasks.push({
        title:
          focus === "job"
            ? "Write a one-line target: role + industry + min must-haves"
            : focus === "freelance"
              ? "Define one clear service + starter price"
              : "Define success for this sprint in one sentence",
        scheduled_date: mon,
        notes: summary.current_status
          ? `Starting from: ${summary.current_status}`
          : "Keep it specific enough to act on today",
      });
    }

    for (let d = 0; d < daysInWeek; d++) {
      const day = addDays(weekStart, d);
      const iso = format(day, "yyyy-MM-dd");
      const dayIndex = w * 7 + d;
      const isSunday = day.getDay() === 0;

      if (isSunday && daysInWeek > 3) {
        weekTasks.push({
          title: "Light review: what got responses? double down Monday",
          scheduled_date: iso,
          notes: "Rest brain, keep the funnel notes clean",
        });
        continue;
      }

      weekTasks.push(...roleTasks(dayIndex, iso));
    }

    if (daysInWeek >= 4) {
      const mid = format(addDays(weekStart, Math.min(3, daysInWeek - 1)), "yyyy-MM-dd");
      weekTasks.push({
        title: `Mid-week check: actions logged toward ${target_role}?`,
        scheduled_date: mid,
        notes: `Target pace ~${weekly_actions}/week · adjust if energy is low`,
      });
    }

    const weekEnd = format(
      addDays(weekStart, Math.max(0, daysInWeek - 1)),
      "yyyy-MM-dd"
    );
    weekTasks.push({
      title:
        w === weekCount - 1
          ? `Sprint finish: do you have interviews, replies, or a paid path?`
          : `Week ${w + 1} wrap: count applications/pitches + plan next week’s list`,
      scheduled_date: weekEnd,
      notes: EARNING_FOCUS_LABELS[focus],
    });

    // de-dupe by title+date roughly
    const seen = new Set<string>();
    const unique = weekTasks.filter((t) => {
      const k = `${t.scheduled_date}|${t.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    milestones.push({
      title:
        w === weekCount - 1
          ? `Finish line — paid path for ${target_role}`
          : `Week ${w + 1} — ${EARNING_FOCUS_LABELS[focus]}`,
      target_date: weekEnd,
      tasks: unique.sort((a, b) =>
        a.scheduled_date.localeCompare(b.scheduled_date)
      ),
    });
  }

  return {
    plan: {
      milestones,
      earning_summary: summary,
    },
    summary,
  };
}
