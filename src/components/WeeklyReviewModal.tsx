"use client";

import { useState } from "react";
import { BookOpen, X } from "lucide-react";

export function WeeklyReviewModal({
  open,
  completed,
  missed,
  remaining,
  suggestions,
  onSave,
  onClose,
}: {
  open: boolean;
  completed: number;
  missed: number;
  remaining: number;
  suggestions: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="card relative z-10 w-full max-w-lg p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-accent/15 p-2 text-accent">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sunday weekly review</h2>
              <p className="text-sm text-muted">
                Reflect without judgment — adjust and grow.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-accent">{completed}</p>
            <p className="text-[11px] text-muted">Completed</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-warn">{missed}</p>
            <p className="text-[11px] text-muted">Missed</p>
          </div>
          <div className="rounded-xl bg-sky-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-sky-300">{remaining}</p>
            <p className="text-[11px] text-muted">Remaining</p>
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-border bg-black/20 p-3 text-sm text-muted">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-accent">
            Suggestion
          </p>
          {suggestions}
        </div>

        <label className="mb-1 block text-xs text-muted">
          Reflection notes
        </label>
        <textarea
          className="input-field min-h-[100px]"
          placeholder="What worked? What will you try differently?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Later
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onSave(notes);
              onClose();
            }}
          >
            Save review
          </button>
        </div>
      </div>
    </div>
  );
}
