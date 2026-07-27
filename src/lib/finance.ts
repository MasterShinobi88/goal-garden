"use client";

import { addMonths, format, parseISO } from "date-fns";
import { uid, todayISO } from "./utils";

export type BillFrequency = "once" | "weekly" | "monthly" | "yearly";

export type Bill = {
  id: string;
  name: string;
  amount: number;
  due_date: string;
  frequency: BillFrequency;
  category: string;
  paid: boolean;
  notes: string;
  created_at: string;
};

export type Payday = {
  id: string;
  label: string;
  amount: number;
  next_date: string;
  frequency: "weekly" | "biweekly" | "monthly" | "once";
  notes: string;
  created_at: string;
};

export type FinancePlanType = "birthday" | "vacation" | "holiday" | "other";

export type FinancePlan = {
  id: string;
  title: string;
  type: FinancePlanType;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  notes: string;
  created_at: string;
};

export type FinanceState = {
  bills: Bill[];
  paydays: Payday[];
  plans: FinancePlan[];
  currency: string;
};

const KEY = "goal-garden:finance";

function empty(): FinanceState {
  return { bills: [], paydays: [], plans: [], currency: "USD" };
}

function load(): FinanceState {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as FinanceState) };
  } catch {
    return empty();
  }
}

function save(state: FinanceState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("goal-garden:finance"));
}

export function getFinance(): FinanceState {
  return load();
}

export function setCurrency(currency: string) {
  const s = load();
  s.currency = currency || "USD";
  save(s);
  return s;
}

export function advanceDate(
  date: string,
  frequency: BillFrequency | Payday["frequency"]
): string {
  const d = parseISO(date);
  switch (frequency) {
    case "weekly":
      return format(new Date(d.getTime() + 7 * 86400000), "yyyy-MM-dd");
    case "biweekly":
      return format(new Date(d.getTime() + 14 * 86400000), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(d, 1), "yyyy-MM-dd");
    case "yearly":
      return format(addMonths(d, 12), "yyyy-MM-dd");
    default:
      return date;
  }
}

// ——— Bills ———
export function addBill(
  input: Omit<Bill, "id" | "created_at" | "paid">
): Bill {
  const s = load();
  const bill: Bill = {
    ...input,
    id: uid(),
    paid: false,
    created_at: new Date().toISOString(),
  };
  s.bills.unshift(bill);
  save(s);
  return bill;
}

export function updateBill(id: string, patch: Partial<Bill>) {
  const s = load();
  s.bills = s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b));
  save(s);
}

export function deleteBill(id: string) {
  const s = load();
  s.bills = s.bills.filter((b) => b.id !== id);
  save(s);
}

/** Mark paid; recurring bills roll to next due date */
export function payBill(id: string) {
  const s = load();
  const bill = s.bills.find((b) => b.id === id);
  if (!bill) return;
  if (bill.frequency === "once") {
    bill.paid = true;
  } else {
    bill.due_date = advanceDate(bill.due_date, bill.frequency);
    bill.paid = false;
  }
  save(s);
}

// ——— Paydays ———
export function addPayday(input: Omit<Payday, "id" | "created_at">): Payday {
  const s = load();
  const p: Payday = {
    ...input,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  s.paydays.unshift(p);
  save(s);
  return p;
}

export function updatePayday(id: string, patch: Partial<Payday>) {
  const s = load();
  s.paydays = s.paydays.map((p) => (p.id === id ? { ...p, ...patch } : p));
  save(s);
}

export function deletePayday(id: string) {
  const s = load();
  s.paydays = s.paydays.filter((p) => p.id !== id);
  save(s);
}

export function receivePayday(id: string) {
  const s = load();
  const p = s.paydays.find((x) => x.id === id);
  if (!p) return;
  if (p.frequency !== "once") {
    p.next_date = advanceDate(p.next_date, p.frequency);
  }
  save(s);
}

// ——— Plans ———
export function addPlan(
  input: Omit<FinancePlan, "id" | "created_at" | "saved_amount"> & {
    saved_amount?: number;
  }
): FinancePlan {
  const s = load();
  const plan: FinancePlan = {
    title: input.title,
    type: input.type,
    target_amount: input.target_amount,
    target_date: input.target_date,
    notes: input.notes,
    saved_amount: input.saved_amount ?? 0,
    id: uid(),
    created_at: new Date().toISOString(),
  };
  s.plans.unshift(plan);
  save(s);
  return plan;
}

export function updatePlan(id: string, patch: Partial<FinancePlan>) {
  const s = load();
  s.plans = s.plans.map((p) => (p.id === id ? { ...p, ...patch } : p));
  save(s);
}

export function deletePlan(id: string) {
  const s = load();
  s.plans = s.plans.filter((p) => p.id !== id);
  save(s);
}

export function addToPlanSavings(id: string, amount: number) {
  const s = load();
  const p = s.plans.find((x) => x.id === id);
  if (!p || amount === 0) return;
  p.saved_amount = Math.max(
    0,
    Math.round((p.saved_amount + amount) * 100) / 100
  );
  save(s);
}

// ——— Insights ———
export function upcomingBills(withinDays = 30): Bill[] {
  const today = todayISO();
  const end = format(
    new Date(Date.now() + withinDays * 86400000),
    "yyyy-MM-dd"
  );
  return load()
    .bills.filter((b) => !b.paid && b.due_date >= today && b.due_date <= end)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function overdueBills(): Bill[] {
  const today = todayISO();
  return load()
    .bills.filter((b) => !b.paid && b.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function nextPayday(): Payday | null {
  const today = todayISO();
  const list = load()
    .paydays.filter((p) => p.next_date >= today)
    .sort((a, b) => a.next_date.localeCompare(b.next_date));
  return list[0] ?? null;
}

export function financeSummary() {
  const s = load();
  const today = todayISO();
  const month = today.slice(0, 7);

  const billsThisMonth = s.bills.filter(
    (b) => !b.paid && b.due_date.startsWith(month)
  );
  const billsDueTotal = billsThisMonth.reduce((n, b) => n + b.amount, 0);

  const in30 = format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd");
  const income30 = s.paydays
    .filter((p) => p.next_date >= today && p.next_date <= in30)
    .reduce((n, p) => n + p.amount, 0);

  const savingsTarget = s.plans.reduce((n, p) => n + p.target_amount, 0);
  const savingsSaved = s.plans.reduce((n, p) => n + p.saved_amount, 0);

  return {
    currency: s.currency,
    billsDueTotal: Math.round(billsDueTotal * 100) / 100,
    billsCount: billsThisMonth.length,
    overdueCount: overdueBills().length,
    income30: Math.round(income30 * 100) / 100,
    nextPay: nextPayday(),
    nextBills: upcomingBills(14).slice(0, 6),
    savingsTarget: Math.round(savingsTarget * 100) / 100,
    savingsSaved: Math.round(savingsSaved * 100) / 100,
    plans: s.plans,
    bills: s.bills,
    paydays: s.paydays,
  };
}

export function formatMoney(amount: number, currency = "USD") {
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

export function planProgress(p: FinancePlan) {
  if (p.target_amount <= 0) return 0;
  return Math.min(100, Math.round((p.saved_amount / p.target_amount) * 100));
}

export function daysUntilDate(iso: string) {
  const a = parseISO(todayISO());
  const b = parseISO(iso);
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

export function suggestedMonthlySave(p: FinancePlan): number {
  const days = Math.max(1, daysUntilDate(p.target_date));
  const remaining = Math.max(0, p.target_amount - p.saved_amount);
  const months = Math.max(1, days / 30.4);
  return Math.ceil(remaining / months);
}

/** Clear daily / weekly / monthly save targets for a finance savings plan */
export function savingsBreakdown(p: FinancePlan): {
  remaining: number;
  days: number;
  daily: number;
  weekly: number;
  monthly: number;
  pct: number;
} {
  const days = Math.max(1, daysUntilDate(p.target_date));
  const remaining = Math.max(0, p.target_amount - p.saved_amount);
  const weeks = Math.max(1, days / 7);
  const months = Math.max(1, days / 30.4);
  return {
    remaining: Math.round(remaining * 100) / 100,
    days,
    daily: Math.ceil((remaining / days) * 100) / 100,
    weekly: Math.ceil((remaining / weeks) * 100) / 100,
    monthly: Math.ceil((remaining / months) * 100) / 100,
    pct: planProgress(p),
  };
}

export const PLAN_TYPE_LABELS: Record<FinancePlanType, string> = {
  birthday: "Birthday",
  vacation: "Vacation",
  holiday: "Holiday",
  other: "Other",
};

export const BILL_CATEGORIES = [
  "Housing",
  "Utilities",
  "Internet",
  "Phone",
  "Insurance",
  "Subscriptions",
  "Transport",
  "Debt",
  "Other",
];
