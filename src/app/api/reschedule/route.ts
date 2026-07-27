import { NextResponse } from "next/server";
import { buildRescheduleProposals } from "@/lib/reschedule";
import type { BusySlot, GoalWithTree } from "@/lib/types";
import { getMockBusySlots } from "@/lib/calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goals = (body.goals ?? []) as GoalWithTree[];
    const busy = (body.busy as BusySlot[] | undefined) ?? getMockBusySlots();
    const result = buildRescheduleProposals(goals, busy);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reschedule failed" },
      { status: 500 }
    );
  }
}
