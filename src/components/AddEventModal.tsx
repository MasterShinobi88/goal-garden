"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { EVENT_COLORS, addUserEvent } from "@/lib/user-events";
import { todayISO, cn } from "@/lib/utils";

export function AddEventModal({
  open,
  initialDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialDate?: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate || todayISO());
  const [allDay, setAllDay] = useState(true);
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[0].hex);

  useEffect(() => {
    if (open) {
      setDate(initialDate || todayISO());
      setTitle("");
      setNotes("");
      setAllDay(true);
      setTime("09:00");
      setColor(EVENT_COLORS[0].hex);
    }
  }, [open, initialDate]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addUserEvent({
      title: title.trim(),
      date,
      time: allDay ? null : time,
      notes,
      color,
    });
    onCreated?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="card relative z-10 w-full max-w-md p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold">Add event</h2>
              <p className="text-xs text-muted">
                A clean personal event on your calendar
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-muted hover:bg-white/5"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Dentist, Date night, Team sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Date</label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Time</label>
              <input
                type="time"
                className="input-field"
                value={time}
                disabled={allDay}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-500"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All-day event
          </label>

          <div>
            <label className="mb-1.5 block text-xs text-muted">Color</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-[#0f1624] transition",
                    color === c.hex ? "ring-2 ring-white/80" : "opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Notes</label>
            <textarea
              className="input-field min-h-[72px] resize-none"
              placeholder="Optional details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!title.trim()}>
              <CalendarPlus className="h-4 w-4" />
              Add to calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
