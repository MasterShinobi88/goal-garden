/**
 * Goal type catalog — what kind of goal the user is planting.
 * Health + Finance are the deepest (extra intake); others get tailored plans.
 */
import type { GoalCategory } from "./types";
import type { PlantType } from "./plants";
import type { GoalDomain } from "./mock-planner";

export type GoalKind =
  | "health_weight"
  | "health"
  | "longevity"
  | "mindset"
  | "finance"
  | "income"
  | "fitness"
  | "learning"
  | "career"
  | "habit"
  | "creative"
  | "relationship"
  | "home"
  | "general";

export type GoalKindMeta = {
  id: GoalKind;
  /** Stored on Goal.category */
  category: GoalCategory;
  label: string;
  short: string;
  emoji: string;
  blurb: string;
  /** Highlight as a primary life area */
  featured?: boolean;
  /** Opens multi-step intake (weight stats or savings $) */
  hasIntake?: boolean;
  placeholders: {
    title: string;
    metrics: string;
    description: string;
  };
  defaultPlant: PlantType;
  domain: GoalDomain;
};

/** Order in the type picker */
export const GOAL_KINDS: GoalKind[] = [
  "health_weight",
  "longevity",
  "mindset",
  "income",
  "finance",
  "fitness",
  "learning",
  "career",
  "habit",
  "creative",
  "relationship",
  "home",
  "health",
  "general",
];

export const GOAL_KIND_META: Record<GoalKind, GoalKindMeta> = {
  health_weight: {
    id: "health_weight",
    category: "weight_loss",
    label: "Weight & body",
    short: "Weight",
    emoji: "⚖️",
    blurb: "Calories, macros, water, and daily movement checklists",
    featured: true,
    hasIntake: true,
    placeholders: {
      title: "e.g. Lose 10 kg healthily by summer",
      metrics: "e.g. Fit jeans, steady energy, weekly weigh-in trend",
      description: "Why this matters for your health…",
    },
    defaultPlant: "oak",
    domain: "weight_loss",
  },
  income: {
    id: "income",
    category: "income",
    label: "Earn & get hired",
    short: "Earn",
    emoji: "🚀",
    blurb: "Jobs, freelancing, first clients — action plan to start getting paid",
    featured: true,
    hasIntake: true,
    placeholders: {
      title: "e.g. Land a job this month · Start freelancing",
      metrics: "e.g. Interview secured · first client · offer letter",
      description: "What work you want and why income matters now…",
    },
    defaultPlant: "bamboo",
    domain: "career",
  },
  finance: {
    id: "finance",
    category: "savings",
    label: "Save & budget",
    short: "Save",
    emoji: "💰",
    blurb: "Big $ target + clear daily and weekly save goals",
    featured: true,
    hasIntake: true,
    placeholders: {
      title: "e.g. Save ₱50,000 emergency fund",
      metrics: "e.g. Auto-transfer every payday, no new debt",
      description: "What you’re saving for…",
    },
    defaultPlant: "bamboo",
    domain: "finance",
  },
  fitness: {
    id: "fitness",
    category: "fitness",
    label: "Fitness & sport",
    short: "Fitness",
    emoji: "🏃",
    blurb: "Training plans, races, strength, yoga — not weight-focused",
    placeholders: {
      title: "e.g. Run a 5K · Build a pull-up · 3× gym / week",
      metrics: "e.g. Finish 5K under 35 min · 3 sessions weekly",
      description: "Current baseline and what “strong” looks like…",
    },
    defaultPlant: "pine",
    domain: "fitness",
  },
  learning: {
    id: "learning",
    category: "learning",
    label: "Learning & skills",
    short: "Learn",
    emoji: "📚",
    blurb: "Courses, exams, languages, coding, certifications",
    placeholders: {
      title: "e.g. Pass the cert exam · Learn Spanish A2",
      metrics: "e.g. 4 study blocks/week · mock exam score 80%+",
      description: "What you want to know or prove…",
    },
    defaultPlant: "bonsai",
    domain: "learning",
  },
  career: {
    id: "career",
    category: "career",
    label: "Career & projects",
    short: "Career",
    emoji: "💼",
    blurb: "Jobs, promotions, launches, side hustles, portfolios",
    placeholders: {
      title: "e.g. Ship the side project · Land a new role",
      metrics: "e.g. Portfolio live · 10 applications · launch date",
      description: "Outcome and why it matters…",
    },
    defaultPlant: "oak",
    domain: "career",
  },
  habit: {
    id: "habit",
    category: "habit",
    label: "Habits & lifestyle",
    short: "Habits",
    emoji: "🔁",
    blurb: "Sleep, meditation, journaling, screen time, routines",
    placeholders: {
      title: "e.g. Sleep by 11pm · Meditate 10 min daily",
      metrics: "e.g. 5 days/week streak · 7h sleep average",
      description: "The tiny version of the habit…",
    },
    defaultPlant: "willow",
    domain: "habit",
  },
  creative: {
    id: "creative",
    category: "creative",
    label: "Creative work",
    short: "Create",
    emoji: "🎨",
    blurb: "Writing, art, music, video, design, content",
    placeholders: {
      title: "e.g. Finish the short story · Post weekly art",
      metrics: "e.g. Draft complete · 8 pieces published",
      description: "What you’re making and for whom…",
    },
    defaultPlant: "sakura",
    domain: "creative",
  },
  relationship: {
    id: "relationship",
    category: "relationship",
    label: "People & family",
    short: "People",
    emoji: "💛",
    blurb: "Partner, family, friends, community connection",
    placeholders: {
      title: "e.g. Weekly date night · Call parents every Sunday",
      metrics: "e.g. 1 dedicated connection each week",
      description: "Who and what “good” looks like…",
    },
    defaultPlant: "sakura",
    domain: "relationship",
  },
  home: {
    id: "home",
    category: "home",
    label: "Home & space",
    short: "Home",
    emoji: "🏠",
    blurb: "Declutter, organize, renovations, moving, garden",
    placeholders: {
      title: "e.g. Declutter the spare room · Weekly home reset",
      metrics: "e.g. One zone done · 10-min nightly tidy",
      description: "Which space and the end state…",
    },
    defaultPlant: "sunflower",
    domain: "home",
  },
  health: {
    id: "health",
    category: "health",
    label: "Health habits",
    short: "Health",
    emoji: "🩺",
    blurb: "Hydration, sleep, checkups, stress — without a weight goal",
    featured: true,
    placeholders: {
      title: "e.g. Drink 2L water · Book annual checkup",
      metrics: "e.g. 8 glasses most days · sleep 7h+",
      description: "Health focus (energy, stress, medical follow-ups)…",
    },
    defaultPlant: "oak",
    domain: "habit",
  },
  longevity: {
    id: "longevity",
    category: "longevity",
    label: "Longevity & anti-aging",
    short: "Longevity",
    emoji: "🧬",
    blurb: "Sleep, strength, VO₂, protein, sunlight, stress — long-game healthspan",
    featured: true,
    placeholders: {
      title: "e.g. Build a longevity stack · Train for healthspan",
      metrics: "e.g. Sleep 7.5h · 2× strength/week · 8k steps · bloodwork yearly",
      description: "What “aging well” means for you (energy, mobility, labs)…",
    },
    defaultPlant: "pine",
    domain: "longevity",
  },
  mindset: {
    id: "mindset",
    category: "mindset",
    label: "Mindset & mental fitness",
    short: "Mindset",
    emoji: "🧠",
    blurb: "Meditation, gratitude, stress skills, focus, growth beliefs",
    featured: true,
    placeholders: {
      title: "e.g. Daily calm practice · Rewire stress response",
      metrics: "e.g. 10 min meditation 5×/week · journal 4 nights",
      description: "What mental shift or skill you want…",
    },
    defaultPlant: "bonsai",
    domain: "mindset",
  },
  general: {
    id: "general",
    category: "general",
    label: "Custom goal",
    short: "Custom",
    emoji: "🌱",
    blurb: "Anything else — flexible weekly milestones",
    placeholders: {
      title: "e.g. Whatever big goal you’re chasing",
      metrics: "e.g. How you’ll know you’re done",
      description: "Why this matters…",
    },
    defaultPlant: "oak",
    domain: "general",
  },
};

export function getGoalKindMeta(kind: GoalKind): GoalKindMeta {
  return GOAL_KIND_META[kind] ?? GOAL_KIND_META.general;
}

export function kindFromCategory(category?: GoalCategory | string | null): GoalKind {
  switch (category) {
    case "weight_loss":
      return "health_weight";
    case "savings":
      return "finance";
    case "income":
      return "income";
    case "fitness":
      return "fitness";
    case "learning":
      return "learning";
    case "career":
      return "career";
    case "habit":
      return "habit";
    case "creative":
      return "creative";
    case "relationship":
      return "relationship";
    case "home":
      return "home";
    case "health":
      return "health";
    case "longevity":
      return "longevity";
    case "mindset":
      return "mindset";
    default:
      return "general";
  }
}

/** Suggest kind from free text when user hasn’t locked a type */
export function suggestKindFromText(title: string, description = ""): GoalKind {
  const t = `${title} ${description}`.toLowerCase();
  if (/weight|lose\s+\d|slim|fat loss|bmi|body fat|lbs?\s*off|kg\s*off/.test(t))
    return "health_weight";
  if (
    /longevity|anti-?ag(e|ing)|healthspan|lifespan|blue zone|senolytic|biological age|vo2|zone 2|nmn|rapamycin|healthspan/.test(
      t
    )
  )
    return "longevity";
  if (
    /mindset|mental health|meditat|gratitude|anxiety|stress skill|growth mindset| Stoic|stoicism|mindful|cognitive|therapy|self-?talk|resilien/.test(
      t
    )
  )
    return "mindset";
  // Earn / get paid BEFORE generic money → savings
  if (
    /earn(ing)?|get\s+(a\s+)?job|find\s+(a\s+)?job|make\s+money|get\s+paid|income|hired|paycheck|salary|freelance|side\s*hustle|job\s*search/.test(
      t
    ) &&
    !/save|savings|emergency fund|debt|pay off|nest egg|budget|down payment/.test(t)
  )
    return "income";
  if (
    /save|debt|budget|invest|emergency fund|pay off|nest egg|down payment|\$\d+|₱\d+|\bphp\b/.test(
      t
    )
  )
    return "finance";
  if (/run|marathon|lift|gym|fitness|muscle|strength|5k|yoga|sport|training|pull-?up/.test(t))
    return "fitness";
  if (/learn|study|course|exam|certif|language|skill|coding|programming|spanish|french/.test(t))
    return "learning";
  if (/job|career|promot|interview|resume|portfolio|side hustle|business|startup|launch/.test(t))
    return "career";
  // Vague "money" / "financial" without save vs earn — prefer earn setup (can switch)
  if (/\bmoney\b|financial|finance/.test(t)) return "income";
  if (/write|book|novel|art|music|paint|film|creative|design|blog|youtube|content/.test(t))
    return "creative";
  if (/habit|journal|sleep|screen time|quit|sober|morning routine|water\s*intake/.test(t))
    return "habit";
  if (/family|relationship|date night|friend|partner|kids|parents/.test(t))
    return "relationship";
  if (/home|clean|renovat|garden|move house|organize|declutter/.test(t))
    return "home";
  if (/health|checkup|doctor|hydrat|blood pressure/.test(t)) return "health";
  return "general";
}

export function categoryLabel(category?: GoalCategory | string | null): string {
  return getGoalKindMeta(kindFromCategory(category)).label;
}

export function categoryEmoji(category?: GoalCategory | string | null): string {
  return getGoalKindMeta(kindFromCategory(category)).emoji;
}
