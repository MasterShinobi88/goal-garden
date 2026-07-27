"use client";

/**
 * User-reorderable sidebar items.
 * Dashboard is always first; Settings is always last.
 */

export type NavItemId =
  | "finance"
  | "journal"
  | "food"
  | "habits"
  | "calendar"
  | "coach"
  | "review";

export type NavItemDef = {
  id: NavItemId;
  href: string;
  label: string;
  /** Optional short label for mobile */
  short?: string;
};

export const FIXED_TOP = {
  id: "dashboard" as const,
  href: "/dashboard",
  label: "Dashboard",
  exact: true,
};

export const FIXED_BOTTOM = {
  id: "settings" as const,
  href: "/dashboard/settings",
  label: "Settings",
};

/** Default middle order */
export const DEFAULT_MIDDLE: NavItemId[] = [
  "habits",
  "finance",
  "journal",
  "food",
  "calendar",
  "coach",
  "review",
];

export const NAV_CATALOG: Record<NavItemId, NavItemDef> = {
  finance: {
    id: "finance",
    href: "/dashboard/finance",
    label: "Finance",
    short: "Money",
  },
  journal: {
    id: "journal",
    href: "/dashboard/journal",
    label: "Journal",
  },
  food: {
    id: "food",
    href: "/dashboard/food",
    label: "Food & meals",
    short: "Food",
  },
  habits: {
    id: "habits",
    href: "/dashboard/habits",
    label: "Habits & sleep",
    short: "Habits",
  },
  calendar: {
    id: "calendar",
    href: "/dashboard/calendar",
    label: "Calendar",
  },
  coach: {
    id: "coach",
    href: "/dashboard/coach",
    label: "Coach",
  },
  review: {
    id: "review",
    href: "/dashboard/review",
    label: "Weekly review",
    short: "Review",
  },
};

const STORAGE_KEY = "goal-garden:nav-order";

export function loadNavOrder(): NavItemId[] {
  if (typeof window === "undefined") return [...DEFAULT_MIDDLE];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_MIDDLE];
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return [...DEFAULT_MIDDLE];

    const valid = parsed.filter((id): id is NavItemId =>
      Boolean(NAV_CATALOG[id as NavItemId])
    );
    // Append any new items not in saved order
    for (const id of DEFAULT_MIDDLE) {
      if (!valid.includes(id)) valid.push(id);
    }
    return valid.length ? valid : [...DEFAULT_MIDDLE];
  } catch {
    return [...DEFAULT_MIDDLE];
  }
}

export function saveNavOrder(order: NavItemId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  window.dispatchEvent(new CustomEvent("goal-garden:nav-order"));
}

export function resetNavOrder() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("goal-garden:nav-order"));
}

export function reorderNav(
  order: NavItemId[],
  fromIndex: number,
  toIndex: number
): NavItemId[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= order.length ||
    toIndex >= order.length ||
    fromIndex === toIndex
  ) {
    return order;
  }
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
