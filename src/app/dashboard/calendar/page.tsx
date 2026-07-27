"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  CalendarPlus,
  Download,
  Sparkles,
  Trophy,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PageHeader } from "@/components/PageHeader";
import { AddEventModal } from "@/components/AddEventModal";
import { TodayWins } from "@/components/TodayWins";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import type { BusySlot } from "@/lib/types";
import { getMockBusySlots, findFreeDays } from "@/lib/calendar";
import { loadPrefs } from "@/lib/local-store";
import { todayISO, cn } from "@/lib/utils";
import { CalendarExport } from "@/components/CalendarExport";
import { CalendarAutoSync } from "@/components/CalendarAutoSync";
import {
  deleteUserEvent,
  listUserEvents,
  type UserEvent,
} from "@/lib/user-events";
import { formatDisplayDate } from "@/lib/utils";

const CalendarView = dynamic(
  () => import("@/components/CalendarView").then((m) => m.CalendarView),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading calendar…" />,
  }
);

type SideTab = "wins" | "events" | "sync" | "export";

export default function CalendarPage() {
  const { user } = useAuthUser();
  const { goals, loading, toggleTask } = useGoals(user?.id);
  const [busy, setBusy] = useState<BusySlot[]>([]);
  const [freeSlots, setFreeSlots] = useState<string[]>([]);
  const [tab, setTab] = useState<SideTab>("wins");
  const [eventOpen, setEventOpen] = useState(false);
  const [eventDate, setEventDate] = useState(todayISO());
  const [eventTick, setEventTick] = useState(0);
  const [myEvents, setMyEvents] = useState<UserEvent[]>([]);

  useEffect(() => {
    async function loadBusy() {
      const prefs = loadPrefs();
      const provider = prefs.calendar_provider || "mock";
      try {
        const res = await fetch(`/api/calendar/busy?provider=${provider}`);
        const data = await res.json();
        setBusy(data.slots || getMockBusySlots());
      } catch {
        setBusy(getMockBusySlots());
      }
    }
    loadBusy();
  }, []);

  useEffect(() => {
    const tasks = goals.flatMap((g) =>
      g.milestones.flatMap((m) => m.daily_tasks)
    );
    setFreeSlots(findFreeDays(todayISO(), 14, busy, tasks).slice(0, 6));
  }, [goals, busy]);

  useEffect(() => {
    setMyEvents(listUserEvents());
    const on = () => setMyEvents(listUserEvents());
    window.addEventListener("goal-garden:user-events", on);
    return () => window.removeEventListener("goal-garden:user-events", on);
  }, [eventTick]);

  if (loading) return <LoadingSpinner />;

  const tabs: { id: SideTab; label: string; icon: typeof Sparkles }[] = [
    { id: "wins", label: "Today", icon: Trophy },
    { id: "events", label: "Events", icon: CalendarPlus },
    { id: "sync", label: "Sync", icon: Sparkles },
    { id: "export", label: "File", icon: Download },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-3 overflow-hidden animate-fade-up">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          className="flex-1"
          eyebrow="Calendar"
          title="Your schedule"
          description="Click a day to add an event. Check off today’s wins and feel the progress."
        />
        <button
          type="button"
          className="btn-primary shrink-0 text-sm"
          onClick={() => {
            setEventDate(todayISO());
            setEventOpen(true);
          }}
        >
          <CalendarPlus className="h-4 w-4" />
          Add event
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1fr_300px]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <CalendarView
            goals={goals}
            busy={busy}
            refreshKey={eventTick}
            onDateClick={(dateStr) => {
              setEventDate(dateStr);
              setEventOpen(true);
            }}
          />
        </div>

        <aside className="flex min-h-0 flex-col overflow-hidden">
          <div className="mb-2 flex shrink-0 gap-1 rounded-xl border border-border bg-black/20 p-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition sm:flex-row sm:justify-center sm:gap-1 sm:text-[11px]",
                    active
                      ? "bg-accent/15 text-accent"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Panel must be flex column + min-h-0 so overflow-y-auto works */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {tab === "wins" && (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="h-full min-h-0">
                  <TodayWins
                    goals={goals}
                    onToggle={(id, done) => void toggleTask(id, done)}
                    compact
                  />
                </div>
              </div>
            )}

            {tab === "events" && (
              <div className="card flex h-full min-h-0 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-3 py-2.5">
                  <p className="text-xs font-semibold">Your events</p>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-[11px]"
                    onClick={() => {
                      setEventDate(todayISO());
                      setEventOpen(true);
                    }}
                  >
                    <CalendarPlus className="h-3 w-3" />
                    New
                  </button>
                </div>
                <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-2">
                  {myEvents.length === 0 && (
                    <li className="px-2 py-6 text-center text-xs text-muted">
                      No personal events yet. Click a day on the calendar or use
                      Add event.
                    </li>
                  )}
                  {myEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start gap-2 rounded-xl border border-border bg-black/20 px-2.5 py-2"
                    >
                      <span
                        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: ev.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{ev.title}</p>
                        <p className="text-[11px] text-muted">
                          {formatDisplayDate(ev.date)}
                          {ev.time ? ` · ${ev.time}` : " · all day"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-[11px] text-muted hover:text-danger"
                        onClick={() => {
                          deleteUserEvent(ev.id);
                          setEventTick((n) => n + 1);
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "sync" && (
              <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-0.5">
                <CalendarAutoSync goals={goals} />
                {freeSlots.length > 0 && (
                  <div className="mt-2 card p-3">
                    <p className="text-[11px] font-medium text-muted">
                      Free days soon
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {freeSlots.map((d) => (
                        <button
                          key={d}
                          type="button"
                          className="rounded-lg border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent"
                          onClick={() => {
                            setEventDate(d);
                            setEventOpen(true);
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Spacer so last content isn’t tight against the edge */}
                <div className="h-3" />
              </div>
            )}

            {tab === "export" && (
              <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-0.5">
                <CalendarExport goals={goals} />
                <div className="h-3" />
              </div>
            )}
          </div>
        </aside>
      </div>

      <AddEventModal
        open={eventOpen}
        initialDate={eventDate}
        onClose={() => setEventOpen(false)}
        onCreated={() => setEventTick((n) => n + 1)}
      />
    </div>
  );
}
