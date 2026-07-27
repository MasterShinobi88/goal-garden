"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import type { BusySlot, GoalWithTree } from "@/lib/types";
import { busyToEvents, tasksToEvents } from "@/lib/calendar";
import {
  listUserEvents,
  userEventsToCalendar,
} from "@/lib/user-events";

export function CalendarView({
  goals,
  busy,
  onDateClick,
  refreshKey = 0,
}: {
  goals: GoalWithTree[];
  busy: BusySlot[];
  onDateClick?: (dateStr: string) => void;
  refreshKey?: number;
}) {
  const [userEvents, setUserEvents] = useState(() =>
    typeof window !== "undefined" ? listUserEvents() : []
  );

  useEffect(() => {
    setUserEvents(listUserEvents());
    const on = () => setUserEvents(listUserEvents());
    window.addEventListener("goal-garden:user-events", on);
    return () => window.removeEventListener("goal-garden:user-events", on);
  }, [refreshKey]);

  const events = useMemo(
    () => [
      ...tasksToEvents(goals),
      ...busyToEvents(busy),
      ...userEventsToCalendar(userEvents),
    ],
    [goals, busy, userEvents]
  );

  return (
    <div className="card calendar-shell flex h-full min-h-0 flex-col p-2 sm:p-4 [&_.fc]:text-sm">
      {/*
        height=100% (not contentHeight auto) so week/day time grids get an
        internal scroller for the full day. dayMaxEvents=false shows every
        all-day task instead of "+N more".
      */}
      <div className="calendar-fc-host min-h-0 min-w-0 flex-1">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
          }}
          height="100%"
          events={events}
          nowIndicator
          /* Show all events — no "+N more" collapse */
          dayMaxEvents={false}
          dayMaxEventRows={false}
          eventDisplay="block"
          fixedWeekCount={false}
          showNonCurrentDates
          navLinks
          weekNumbers={false}
          /* Full 24h day; start scrolled near morning */
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="06:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          allDaySlot
          allDayText="All day"
          stickyHeaderDates
          dayHeaderFormat={{ weekday: "short" }}
          views={{
            dayGridMonth: {
              dayMaxEvents: false,
              dayMaxEventRows: false,
              titleFormat: { year: "numeric", month: "long" },
            },
            timeGridWeek: {
              dayMaxEvents: false,
              titleFormat: { month: "short", day: "numeric" },
              dayHeaderFormat: {
                weekday: "short",
                month: "numeric",
                day: "numeric",
                omitCommas: true,
              },
            },
            timeGridDay: {
              dayMaxEvents: false,
              titleFormat: {
                weekday: "long",
                month: "long",
                day: "numeric",
              },
              dayHeaderFormat: {
                weekday: "long",
                month: "short",
                day: "numeric",
              },
            },
          }}
          dateClick={(arg: DateClickArg) => {
            onDateClick?.(arg.dateStr);
          }}
          editable={false}
        />
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap gap-3 border-t border-border/60 pt-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Goal tasks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" /> Your events
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" /> Busy
        </span>
        <span className="text-[10px] text-muted/80">
          All-day tasks listed fully · Week/Day scroll midnight–midnight
        </span>
      </div>
    </div>
  );
}
