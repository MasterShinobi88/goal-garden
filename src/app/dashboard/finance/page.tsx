"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cake,
  Calendar,
  Check,
  Landmark,
  Plane,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  addBill,
  addPayday,
  addPlan,
  addToPlanSavings,
  BILL_CATEGORIES,
  deleteBill,
  deletePayday,
  deletePlan,
  financeSummary,
  formatMoney,
  payBill,
  PLAN_TYPE_LABELS,
  planProgress,
  receivePayday,
  savingsBreakdown,
  type Bill,
  type BillFrequency,
  type FinancePlan,
  type FinancePlanType,
  type Payday,
} from "@/lib/finance";
import { formatDisplayDate, todayISO, cn } from "@/lib/utils";

type Tab = "overview" | "bills" | "paydays" | "plans";

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState(() =>
    typeof window !== "undefined"
      ? financeSummary()
      : {
          currency: "USD",
          billsDueTotal: 0,
          billsCount: 0,
          overdueCount: 0,
          income30: 0,
          nextPay: null as Payday | null,
          nextBills: [] as Bill[],
          savingsTarget: 0,
          savingsSaved: 0,
          plans: [] as FinancePlan[],
          bills: [] as Bill[],
          paydays: [] as Payday[],
        }
  );
  const [showForm, setShowForm] = useState<null | "bill" | "payday" | "plan">(
    null
  );

  const refresh = useCallback(() => {
    setSummary(financeSummary());
  }, []);

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("goal-garden:finance", on);
    return () => window.removeEventListener("goal-garden:finance", on);
  }, [refresh]);

  const cur = summary.currency;
  const savingsPct =
    summary.savingsTarget > 0
      ? Math.min(
          100,
          Math.round((summary.savingsSaved / summary.savingsTarget) * 100)
        )
      : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bills", label: "Bills" },
    { id: "paydays", label: "Paydays" },
    { id: "plans", label: "Plans" },
  ];

  return (
    <div className="mx-auto flex h-full max-w-5xl min-h-0 flex-col gap-3 animate-fade-up">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          className="flex-1"
          eyebrow="Money"
          title="Finance"
          description="Bills, paydays, and savings for birthdays & vacations."
        />
        <div className="flex shrink-0 flex-wrap gap-2">
          {tab === "bills" && (
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => setShowForm("bill")}
            >
              <Plus className="h-4 w-4" /> Bill
            </button>
          )}
          {tab === "paydays" && (
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => setShowForm("payday")}
            >
              <Plus className="h-4 w-4" /> Payday
            </button>
          )}
          {tab === "plans" && (
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => setShowForm("plan")}
            >
              <Plus className="h-4 w-4" /> Plan
            </button>
          )}
          {tab === "overview" && (
            <>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setTab("bills");
                  setShowForm("bill");
                }}
              >
                <Plus className="h-4 w-4" /> Bill
              </button>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => {
                  setTab("plans");
                  setShowForm("plan");
                }}
              >
                <Plus className="h-4 w-4" /> Plan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-1 rounded-xl border border-border bg-black/25 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-2 text-xs font-medium transition",
              tab === t.id
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-1">
        {tab === "overview" && (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <Metric
                label="Bills this month"
                value={formatMoney(summary.billsDueTotal, cur)}
                sub={`${summary.billsCount} open`}
                tone="text-orange-300"
              />
              <Metric
                label="Income (30d)"
                value={formatMoney(summary.income30, cur)}
                sub={
                  summary.nextPay
                    ? `Next ${formatDisplayDate(summary.nextPay.next_date)}`
                    : "No payday set"
                }
                tone="text-accent"
              />
              <Metric
                label="Saved for plans"
                value={formatMoney(summary.savingsSaved, cur)}
                sub={
                  summary.savingsTarget
                    ? `${savingsPct}% of ${formatMoney(summary.savingsTarget, cur)}`
                    : "No plans yet"
                }
                tone="text-sky-300"
              />
              <Metric
                label="Overdue"
                value={String(summary.overdueCount)}
                sub={summary.overdueCount ? "Needs attention" : "All clear"}
                tone={
                  summary.overdueCount ? "text-danger" : "text-muted"
                }
              />
            </div>

            <div className="card flex min-h-0 flex-col p-4">
              <p className="section-label mb-2">Next 14 days · bills</p>
              {summary.nextBills.length === 0 ? (
                <p className="text-sm text-muted">No bills due soon.</p>
              ) : (
                <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {summary.nextBills.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.name}</p>
                        <p className="text-[11px] text-muted">
                          {formatDisplayDate(b.due_date)} · {b.category}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums text-orange-300">
                        {formatMoney(b.amount, cur)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-4 lg:col-span-2">
              <p className="section-label mb-2">Savings plans</p>
              {summary.plans.length === 0 ? (
                <p className="text-sm text-muted">
                  Plan a birthday gift or vacation — track what to set aside
                  each month.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {summary.plans.slice(0, 4).map((p) => (
                    <PlanRow key={p.id} plan={p} currency={cur} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "bills" && (
          <BillsPanel
            bills={summary.bills}
            currency={cur}
            onPay={(id) => {
              payBill(id);
              refresh();
            }}
            onDelete={(id) => {
              deleteBill(id);
              refresh();
            }}
          />
        )}

        {tab === "paydays" && (
          <PaydaysPanel
            paydays={summary.paydays}
            currency={cur}
            onReceive={(id) => {
              receivePayday(id);
              refresh();
            }}
            onDelete={(id) => {
              deletePayday(id);
              refresh();
            }}
          />
        )}

        {tab === "plans" && (
          <PlansPanel
            plans={summary.plans}
            currency={cur}
            onSave={(id, amt) => {
              addToPlanSavings(id, amt);
              refresh();
            }}
            onDelete={(id) => {
              deletePlan(id);
              refresh();
            }}
          />
        )}
      </div>

      {showForm === "bill" && (
        <BillForm
          onClose={() => setShowForm(null)}
          onSave={(data) => {
            addBill(data);
            setShowForm(null);
            setTab("bills");
            refresh();
          }}
        />
      )}
      {showForm === "payday" && (
        <PaydayForm
          onClose={() => setShowForm(null)}
          onSave={(data) => {
            addPayday(data);
            setShowForm(null);
            setTab("paydays");
            refresh();
          }}
        />
      )}
      {showForm === "plan" && (
        <PlanForm
          onClose={() => setShowForm(null)}
          onSave={(data) => {
            addPlan(data);
            setShowForm(null);
            setTab("plans");
            refresh();
          }}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="card p-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone)}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
    </div>
  );
}

function BillsPanel({
  bills,
  currency,
  onPay,
  onDelete,
}: {
  bills: Bill[];
  currency: string;
  onPay: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const open = bills
    .filter((b) => !b.paid)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const paid = bills.filter((b) => b.paid);

  if (!bills.length) {
    return (
      <Empty
        icon={Wallet}
        title="No bills yet"
        body="Add rent, utilities, subscriptions — track what’s due next."
      />
    );
  }

  return (
    <div className="space-y-2">
      {open.map((b) => {
        const overdue = b.due_date < todayISO();
        return (
          <div
            key={b.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{b.name}</p>
              <p className="text-[11px] text-muted">
                {formatDisplayDate(b.due_date)} · {b.frequency} · {b.category}
                {overdue && (
                  <span className="ml-1 text-danger">· overdue</span>
                )}
              </p>
            </div>
            <span className="font-semibold tabular-nums text-orange-300">
              {formatMoney(b.amount, currency)}
            </span>
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => onPay(b.id)}
              title="Mark paid / roll next due"
            >
              <Check className="h-3.5 w-3.5" />
              Paid
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted hover:text-danger"
              onClick={() => onDelete(b.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      {paid.length > 0 && (
        <p className="pt-2 text-[11px] text-muted">
          {paid.length} one-time bill(s) marked paid
        </p>
      )}
    </div>
  );
}

function PaydaysPanel({
  paydays,
  currency,
  onReceive,
  onDelete,
}: {
  paydays: Payday[];
  currency: string;
  onReceive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!paydays.length) {
    return (
      <Empty
        icon={Landmark}
        title="No paydays"
        body="Add paycheck dates so you can plan bills around income."
      />
    );
  }

  return (
    <div className="space-y-2">
      {paydays
        .slice()
        .sort((a, b) => a.next_date.localeCompare(b.next_date))
        .map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{p.label}</p>
              <p className="text-[11px] text-muted">
                {formatDisplayDate(p.next_date)} · {p.frequency}
              </p>
            </div>
            <span className="font-semibold tabular-nums text-accent">
              {formatMoney(p.amount, currency)}
            </span>
            {p.frequency !== "once" && (
              <button
                type="button"
                className="btn-ghost px-2 py-1 text-xs"
                onClick={() => onReceive(p.id)}
              >
                Got paid
              </button>
            )}
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted hover:text-danger"
              onClick={() => onDelete(p.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  );
}

function PlansPanel({
  plans,
  currency,
  onSave,
  onDelete,
}: {
  plans: FinancePlan[];
  currency: string;
  onSave: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}) {
  if (!plans.length) {
    return (
      <Empty
        icon={Plane}
        title="No savings plans"
        body="Plan a birthday, vacation, or holiday — set a target and track monthly set-asides."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plans.map((p) => (
        <PlanRow
          key={p.id}
          plan={p}
          currency={currency}
          onSave={onSave}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function PlanRow({
  plan,
  currency,
  compact,
  onSave,
  onDelete,
}: {
  plan: FinancePlan;
  currency: string;
  compact?: boolean;
  onSave?: (id: string, amount: number) => void;
  onDelete?: (id: string) => void;
}) {
  const pct = planProgress(plan);
  const Icon =
    plan.type === "birthday"
      ? Cake
      : plan.type === "vacation"
        ? Plane
        : Calendar;

  return (
    <div className="card p-3.5">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/12 text-sky-300 ring-1 ring-sky-400/15">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{plan.title}</p>
          <p className="text-[11px] text-muted">
            {PLAN_TYPE_LABELS[plan.type]} · by{" "}
            {formatDisplayDate(plan.target_date)}
          </p>
        </div>
        {!compact && onDelete && (
          <button
            type="button"
            className="p-1 text-muted hover:text-danger"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3 flex justify-between text-xs">
        <span className="text-muted">
          {formatMoney(plan.saved_amount, currency)} saved
        </span>
        <span className="font-medium tabular-nums text-sky-300">
          {formatMoney(plan.target_amount, currency)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-700 to-sky-300 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {(() => {
        const b = savingsBreakdown(plan);
        return (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-muted">
              Need {formatMoney(b.remaining, currency)} more · {pct}%
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg border border-accent/20 bg-accent/10 px-1 py-1.5">
                <p className="text-[9px] uppercase text-muted">Daily</p>
                <p className="text-[11px] font-semibold text-accent">
                  {formatMoney(b.daily, currency)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-black/20 px-1 py-1.5">
                <p className="text-[9px] uppercase text-muted">Weekly</p>
                <p className="text-[11px] font-semibold">
                  {formatMoney(b.weekly, currency)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-black/20 px-1 py-1.5">
                <p className="text-[9px] uppercase text-muted">Monthly</p>
                <p className="text-[11px] font-semibold">
                  {formatMoney(b.monthly, currency)}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
      {!compact && onSave && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[25, 50, 100, 200].map((n) => (
            <button
              key={n}
              type="button"
              className="btn-ghost px-2 py-1 text-[11px]"
              onClick={() => onSave(plan.id, n)}
            >
              +{formatMoney(n, currency)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Wallet;
  title: string;
  body: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="card relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" className="p-1 text-muted" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BillForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (b: Omit<Bill, "id" | "created_at" | "paid">) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState(todayISO());
  const [freq, setFreq] = useState<BillFrequency>("monthly");
  const [category, setCategory] = useState("Utilities");
  const [notes, setNotes] = useState("");

  return (
    <ModalShell title="Add bill" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!name.trim() || !n) return;
          onSave({
            name: name.trim(),
            amount: n,
            due_date: due,
            frequency: freq,
            category,
            notes,
          });
        }}
      >
        <input
          className="input-field"
          placeholder="Name (e.g. Rent)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            className="input-field"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            className="input-field"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="input-field"
            value={freq}
            onChange={(e) => setFreq(e.target.value as BillFrequency)}
          >
            <option value="once">Once</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <select
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <input
          className="input-field"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full">
          Save bill
        </button>
      </form>
    </ModalShell>
  );
}

function PaydayForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Omit<Payday, "id" | "created_at">) => void;
}) {
  const [label, setLabel] = useState("Paycheck");
  const [amount, setAmount] = useState("");
  const [next, setNext] = useState(todayISO());
  const [freq, setFreq] =
    useState<Payday["frequency"]>("biweekly");
  const [notes, setNotes] = useState("");

  return (
    <ModalShell title="Add payday" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(amount);
          if (!label.trim() || !n) return;
          onSave({
            label: label.trim(),
            amount: n,
            next_date: next,
            frequency: freq,
            notes,
          });
        }}
      >
        <input
          className="input-field"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            className="input-field"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            type="date"
            className="input-field"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>
        <select
          className="input-field"
          value={freq}
          onChange={(e) => setFreq(e.target.value as Payday["frequency"])}
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
          <option value="once">Once</option>
        </select>
        <input
          className="input-field"
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full">
          Save payday
        </button>
      </form>
    </ModalShell>
  );
}

function PlanForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (
    p: Omit<FinancePlan, "id" | "created_at" | "saved_amount"> & {
      saved_amount?: number;
    }
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FinancePlanType>("vacation");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");
  const [date, setDate] = useState(
    () =>
      new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const preview = (() => {
    const t = Number(target);
    const s = Number(saved) || 0;
    if (!t || t <= 0 || !date) return null;
    return savingsBreakdown({
      id: "",
      title: "",
      type,
      target_amount: t,
      saved_amount: s,
      target_date: date,
      notes: "",
      created_at: "",
    });
  })();

  return (
    <ModalShell title="New savings plan" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = Number(target);
          if (!title.trim() || !t) return;
          onSave({
            title: title.trim(),
            type,
            target_amount: t,
            saved_amount: Number(saved) || 0,
            target_date: date,
            notes,
          });
        }}
      >
        <p className="text-xs text-muted">
          Set one <strong className="text-foreground">big goal</strong> (total
          $). We’ll show clear <strong className="text-foreground">daily</strong>{" "}
          and weekly amounts so you always know what to save.
        </p>
        <div>
          <label className="mb-1 block text-xs text-muted">
            What are you saving for? *
          </label>
          <input
            className="input-field"
            placeholder="e.g. Mom’s birthday · Hawaii trip · Emergency fund"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Category</label>
          <select
            className="input-field"
            value={type}
            onChange={(e) => setType(e.target.value as FinancePlanType)}
          >
            {(Object.keys(PLAN_TYPE_LABELS) as FinancePlanType[]).map((k) => (
              <option key={k} value={k}>
                {PLAN_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">
              Big goal (total $) *
            </label>
            <input
              type="number"
              min={0}
              className="input-field"
              placeholder="2000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Already saved</label>
            <input
              type="number"
              min={0}
              className="input-field"
              placeholder="0"
              value={saved}
              onChange={(e) => setSaved(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">
            Deadline (when you need it) *
          </label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {preview && preview.remaining > 0 && (
          <div className="rounded-xl border border-accent/25 bg-accent/10 p-3">
            <p className="text-xs font-medium text-accent">Your clear targets</p>
            <p className="mt-1 text-sm text-foreground">
              Need{" "}
              <strong>{formatMoney(preview.remaining)}</strong> more in{" "}
              {preview.days} days
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/25 px-2 py-2">
                <p className="text-[10px] text-muted">Daily goal</p>
                <p className="text-sm font-bold text-accent">
                  {formatMoney(preview.daily)}
                </p>
              </div>
              <div className="rounded-lg bg-black/25 px-2 py-2">
                <p className="text-[10px] text-muted">Weekly</p>
                <p className="text-sm font-bold">
                  {formatMoney(preview.weekly)}
                </p>
              </div>
              <div className="rounded-lg bg-black/25 px-2 py-2">
                <p className="text-[10px] text-muted">Monthly</p>
                <p className="text-sm font-bold">
                  {formatMoney(preview.monthly)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Tip: put the daily amount on autopilot, or transfer the weekly
              amount every payday.
            </p>
          </div>
        )}

        <input
          className="input-field"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button type="submit" className="btn-primary w-full">
          Create plan
        </button>
      </form>
    </ModalShell>
  );
}
