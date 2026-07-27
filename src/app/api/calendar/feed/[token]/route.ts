import { NextResponse } from "next/server";
import { loadFeed } from "@/lib/calendar-feed-store";

type Params = { params: Promise<{ token: string }> };

/**
 * Subscribeable calendar feed.
 * Google / Outlook / Apple poll this URL and refresh events automatically.
 *
 * Accepts:
 *   /api/calendar/feed/TOKEN
 *   /api/calendar/feed/TOKEN.ics
 */
export async function GET(_request: Request, { params }: Params) {
  const { token: raw } = await params;
  const token = raw.replace(/\.ics$/i, "").replace(/[^a-zA-Z0-9_-]/g, "");

  if (!token) {
    return new NextResponse("Not found", { status: 404 });
  }

  const feed = await loadFeed(token);
  if (!feed) {
    return new NextResponse(
      "Calendar feed not found. Open Goal Garden → Calendar → enable Auto-sync and publish.",
      { status: 404, headers: { "Content-Type": "text/plain" } }
    );
  }

  return new NextResponse(feed.ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="goal-garden.ics"`,
      // Encourage clients to refresh (many ignore this and use their own interval)
      "Cache-Control": "no-cache, max-age=0, must-revalidate",
      "X-Goal-Garden-Updated": feed.updatedAt,
      "X-Goal-Garden-Events": String(feed.eventCount),
    },
  });
}
