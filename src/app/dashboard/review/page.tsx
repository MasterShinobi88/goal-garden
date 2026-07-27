"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  HelpCircle,
  Save,
  Target,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import { summarizeWeek } from "@/lib/reschedule";
import { loadReviews, saveReview } from "@/lib/local-store";
import { weekStartISO, uid, formatDisplayDate } from "@/lib/utils";

/**
 * Weekly Review ≠ Journal
 *
 * Journal = anytime feelings, free writing, moods.
 * Weekly Review = structured look at THIS WEEK’s goal tasks:
 *   auto stats (done / missed / remaining) + one short “what will I change?”
 * It’s a performance check-in for your garden, not a diary.
 */
export default function ReviewPage() {
  const { user } = useAuthUser();
  const { goals, loading } = useGoals(user?.id);
  const week = weekStartISO();
  const summary = useMemo(() => summarizeWeek(goals, week), [goals, week]);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const history = user
    ? loadReviews().filter((r) => r.user_id === user.id)
    : [];

  if (loading) return <LoadingSpinner />;

  const total = summary.completed + summary.missed + summary.remaining;
  const hitRate =
    total > 0 ? Math.round((summary.completed / total) * 100) : 0;

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col gap-3 overflow-hidden animate-fade-up">
      <div className="shrink-0">
        <PageHeader
          eyebrow="Weekly check-in"
          title="Weekly review"
          description={`Week of ${formatDisplayDate(week)} — how your goal tasks went, not a free diary.`}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1">
        {/* Journal vs Review explainer */}
        <div className="card border-accent/15 bg-gradient-to-br from-accent/[0.06] to-transparent p-4">
          <div className="flex gap-2">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                Review vs Journal — what’s the difference?
              </p>
              <div className="mt-2 grid gap-2 text-xs leading-relaxed text-muted sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-black/20 p-3">
                  <p className="mb-1 font-medium text-accent">Weekly review</p>
                  <p>
                    Looks at <strong className="text-foreground">goal tasks</strong>{" "}
                    from this week: completed, missed, still open. Auto-counted
                    for you. You add one short note: what to keep or change next
                    week.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-black/20 p-3">
                  <p className="mb-1 font-medium text-sky-300">Journal</p>
                  <p>
                    Free writing anytime — moods, gratitude, hard days. Not
                    tied to task stats. Use it for feelings; use Review for{" "}
                    <strong className="text-foreground">planning</strong>.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/journal"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Open journal
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Auto stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat
            icon={CheckCircle2}
            label="Completed"
            value={summary.completed}
            tone="text-accent"
          />
          <Stat
            icon={CircleDashed}
            label="Missed"
            value={summary.missed}
            tone="text-warn"
          />
          <Stat
            icon={Target}
            label="Still open"
            value={summary.remaining}
            tone="text-sky-300"
          />
        </div>

        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted">This week’s hit rate</span>
            <span className="font-semibold tabular-nums text-accent">
              {hitRate}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-accent transition-all"
              style={{ width: `${hitRate}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Based on tasks scheduled this week across your goals.
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="mb-2 flex items-center gap-2 text-accent">
            <BookOpen className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Suggested focus</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {summary.suggestions}
          </p>

          <label className="mb-1 mt-4 block text-xs font-medium text-muted">
            Your plan for next week{" "}
            <span className="font-normal text-muted/70">
              (optional — 1–3 sentences)
            </span>
          </label>
          <p className="mb-2 text-[11px] text-muted">
            Examples: “Protect Tuesday for deep work.” · “Shrink daily tasks if
            I miss again.” · “Keep the water habit — it worked.”
          </p>
          <textarea
            className="input-field min-h-[88px] resize-none text-sm"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved(false);
            }}
            placeholder="What will I keep, stop, or start next week?"
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            {saved ? (
              <p className="text-xs text-accent">Saved for this week.</p>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                if (!user) return;
                saveReview({
                  id: uid(),
                  user_id: user.id,
                  week_start: week,
                  completed_count: summary.completed,
                  missed_count: summary.missed,
                  reflection_notes: notes,
                  suggestions: summary.suggestions,
                  created_at: new Date().toISOString(),
                });
                setSaved(true);
              }}
            >
              <Save className="h-4 w-4" />
              Save review
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="space-y-2">
            <p className="section-label px-0.5">Past reviews</p>
            {history.slice(0, 4).map((r) => (
              <div key={r.id} className="card p-3 text-sm">
                <p className="text-[11px] text-muted">
                  Week of {formatDisplayDate(r.week_start)} ·{" "}
                  {r.completed_count} done / {r.missed_count} missed
                </p>
                {r.reflection_notes && (
                  <p className="mt-1 text-muted">{r.reflection_notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card p-3 text-center sm:p-4">
      <Icon className={`mx-auto mb-1 h-4 w-4 ${tone}`} />
      <p className={`text-2xl font-semibold tabular-nums sm:text-3xl ${tone}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted sm:text-xs">{label}</p>
    </div>
  );
}
