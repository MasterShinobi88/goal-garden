import { NextResponse } from "next/server";
import { getMockBusySlots } from "@/lib/calendar";

/**
 * Returns busy slots for conflict detection.
 * When Google/Outlook OAuth is configured, extend this route to fetch real events.
 * Until then, mock slots simulate external calendar conflicts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "mock";
  const days = Number(searchParams.get("days") || "28");

  if (provider === "google" || provider === "outlook") {
    // Placeholder: wire OAuth tokens from settings / server session.
    // Return mock with a flag so UI can show "connected (simulated)".
    return NextResponse.json({
      provider,
      simulated: true,
      slots: getMockBusySlots(days),
      message:
        "OAuth not configured — showing simulated busy times. Add client IDs in Settings.",
    });
  }

  return NextResponse.json({
    provider: "mock",
    simulated: true,
    slots: getMockBusySlots(days),
  });
}
