"use client";

import { useState } from "react";
import { CalendarClock, Heart, Loader2 } from "lucide-react";
import type { RescheduleProposal } from "@/lib/reschedule";
import { formatDisplayDate } from "@/lib/utils";

export function RescheduleBanner({
  message,
  proposals,
  onApply,
  onDismiss,
}: {
  message: string;
  proposals: RescheduleProposal[];
  onApply: (proposals: RescheduleProposal[]) => Promise<void> | void;
  onDismiss: () => void;
}) {
  const [loading, setLoading] = useState(false);
  if (proposals.length === 0) return null;

  return (
    <div className="card border-warn/30 bg-gradient-to-r from-amber-500/10 to-transparent p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl bg-warn/15 p-2 text-warn">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-warn">Gentle reschedule</h3>
            <p className="mt-1 text-sm text-muted">{message}</p>
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-muted">
              {proposals.slice(0, 5).map((p) => (
                <li key={p.taskId}>
                  <span className="text-foreground">{p.title}</span>
                  {" · "}
                  {formatDisplayDate(p.from)} → {formatDisplayDate(p.to)}
                </li>
              ))}
              {proposals.length > 5 && (
                <li>+{proposals.length - 5} more tasks</li>
              )}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={onDismiss}>
            Not now
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await onApply(proposals);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarClock className="h-4 w-4" />
            )}
            Shift to free days
          </button>
        </div>
      </div>
    </div>
  );
}
