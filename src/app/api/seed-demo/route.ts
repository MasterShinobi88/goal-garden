import { NextResponse } from "next/server";
import { buildDemoGoal } from "@/lib/demo-data";

/** Returns the sample “Launch a side project” goal structure (client persists it). */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || "demo-user");
    const goal = buildDemoGoal(userId);
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
