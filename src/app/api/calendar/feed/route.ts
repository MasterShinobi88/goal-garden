import { NextResponse } from "next/server";
import { saveFeed } from "@/lib/calendar-feed-store";

/**
 * Publish / update a subscribeable calendar feed.
 * Body: { token, ics, eventCount }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token || "").replace(/[^a-zA-Z0-9_-]/g, "");
    const ics = String(body.ics || "");
    const eventCount = Number(body.eventCount || 0);

    if (!token || token.length < 16) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (!ics.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json({ error: "Invalid ICS payload" }, { status: 400 });
    }
    // Soft size cap ~1.5MB
    if (ics.length > 1_500_000) {
      return NextResponse.json({ error: "Calendar too large" }, { status: 413 });
    }

    await saveFeed({
      token,
      ics,
      eventCount,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      token,
      eventCount,
      path: `/api/calendar/feed/${token}.ics`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
