"use client";

import type { ReactNode } from "react";
import { Briefcase, Clock, Target, TrendingUp, Zap } from "lucide-react";
import type { EarningPlanSummary, EarningProfile } from "@/lib/earning-plan";
import {
  EARNING_FOCUS_LABELS,
} from "@/lib/earning-plan";
import { formatMoneyAmount } from "@/lib/savings-plan";

export function EarningPlanCard({
  profile,
  plan,
}: {
  profile?: EarningProfile | null;
  plan: EarningPlanSummary;
}) {
  const focus = plan.focus || profile?.focus || "job";

  return (
    <div className="min-w-0 space-y-4">
      <div className="card overflow-hidden p-0">
        <div className="border-b border-border bg-gradient-to-r from-sky-500/15 to-emerald-500/10 px-4 py-3">
          <h3 className="text-sm font-semibold leading-snug sm:text-base">
            Earning plan
          </h3>
          <p className="text-xs text-muted">
            Action path to income — not a savings target
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-300">
            <Briefcase className="h-3 w-3" />
            {EARNING_FOCUS_LABELS[focus]}
          </p>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3">
            <p className="flex items-center gap-1.5 text-xs text-sky-300">
              <Target className="h-3.5 w-3.5" /> Aim
            </p>
            <p className="mt-1 text-lg font-bold leading-snug">
              {plan.target_role}
            </p>
            {plan.target_income != null && (
              <p className="mt-1 text-xs text-muted">
                Optional income filter:{" "}
                <span className="font-medium text-foreground">
                  {formatMoneyAmount(plan.target_income, plan.currency)}/mo
                </span>
              </p>
            )}
            {plan.current_status && (
              <p className="mt-1 text-[11px] text-muted">
                Starting from: {plan.current_status}
              </p>
            )}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Your pace
          </p>
          <div className="grid grid-cols-1 gap-2">
            <PaceRow
              icon={<Zap className="h-4 w-4 text-amber-400" />}
              label="Weekly actions"
              value={`~${plan.weekly_actions}`}
              hint="Applications, pitches, outreach"
              accent
            />
            <PaceRow
              icon={<Clock className="h-4 w-4 text-sky-400" />}
              label="Time budget"
              value={`${plan.hours_per_week}h`}
              hint="per week focused work"
            />
            <PaceRow
              icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              label="Sprint length"
              value={`${plan.days_total} days`}
              hint="until deadline"
            />
          </div>

          <div className="rounded-xl border border-border bg-black/20 p-3">
            <p className="text-xs font-medium text-foreground">Daily focus</p>
            <p className="mt-1 text-xs text-muted">{plan.daily_focus}</p>
          </div>

          <ul className="space-y-1 text-xs text-muted">
            {plan.tips.slice(0, 3).map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
          <p className="text-[11px] text-muted/80">{plan.disclaimer}</p>
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
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2.5"
          : "flex items-center gap-3 rounded-xl border border-border bg-black/20 px-3 py-2.5"
      }
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-[11px] text-muted/80">{hint}</p>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
