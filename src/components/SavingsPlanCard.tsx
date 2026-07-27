"use client";

import { Calendar, PiggyBank, Target, TrendingUp, Wallet } from "lucide-react";
import type { SavingsPlanSummary, SavingsProfile } from "@/lib/savings-plan";
import {
  PURPOSE_LABELS,
  formatMoneyAmount,
} from "@/lib/savings-plan";

export function SavingsPlanCard({
  profile,
  plan,
}: {
  profile?: SavingsProfile | null;
  plan: SavingsPlanSummary;
}) {
  const cur = plan.currency || profile?.currency || "USD";
  const $ = (n: number) => formatMoneyAmount(n, cur);
  const pct =
    plan.target_amount > 0
      ? Math.min(
          100,
          Math.round((plan.already_saved / plan.target_amount) * 100)
        )
      : 0;

  return (
    <div className="min-w-0 space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="border-b border-border bg-gradient-to-r from-emerald-500/15 to-amber-500/10 px-4 py-3">
          <h3 className="text-sm font-semibold leading-snug sm:text-base">
            Savings plan
          </h3>
          <p className="text-xs text-muted">
            Big goal + clear daily targets
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            <PiggyBank className="h-3 w-3" />
            {PURPOSE_LABELS[plan.purpose]}
          </p>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-accent/25 bg-accent/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-accent">
              <Target className="h-3.5 w-3.5" /> Big goal
            </p>
            <p className="mt-1 text-2xl font-bold">{$(plan.target_amount)}</p>
            <p className="text-[11px] text-muted">
              Already saved {$(plan.already_saved)} · need{" "}
              <span className="font-medium text-foreground">
                {$(plan.remaining)}
              </span>{" "}
              more · {plan.days_total} days
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted">{pct}% of target</p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Your daily goals
          </p>
          <div className="grid grid-cols-1 gap-2">
            <PaceRow
              icon={<Wallet className="h-4 w-4 text-emerald-400" />}
              label="Every day"
              value={$(plan.daily_save)}
              hint="Primary daily goal"
              accent
            />
            <PaceRow
              icon={<Calendar className="h-4 w-4 text-sky-400" />}
              label="Every week"
              value={$(plan.weekly_save)}
              hint="If you prefer one transfer"
            />
            <PaceRow
              icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
              label="Every month"
              value={$(plan.monthly_save)}
              hint="Rough monthly pace"
            />
          </div>
        </div>

        {plan.checkpoints.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-medium">Checkpoints</p>
            <ul className="space-y-1.5 text-xs text-muted">
              {plan.checkpoints.slice(0, 6).map((c) => (
                <li key={c.week} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{c.label}</span>
                  <span className="shrink-0 font-medium text-accent">
                    {$(c.cumulative)}
                  </span>
                </li>
              ))}
              {plan.checkpoints.length > 6 && (
                <li className="text-[11px] opacity-70">
                  +{plan.checkpoints.length - 6} more weeks…
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="border-t border-border px-4 py-3">
          <ul className="space-y-1 text-xs text-muted">
            {plan.tips.slice(0, 4).map((t) => (
              <li key={t} className="leading-relaxed">
                • {t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] opacity-70">{plan.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

function PaceRow({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
        accent
          ? "border-emerald-400/30 bg-emerald-400/10"
          : "border-border bg-black/20"
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-[11px] text-muted/80">{hint}</p>
      </div>
      <p
        className={`shrink-0 text-lg font-bold ${
          accent ? "text-accent" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
