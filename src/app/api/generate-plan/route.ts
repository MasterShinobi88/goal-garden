import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai";
import type { BusySlot } from "@/lib/types";
import type { WeightLossProfile } from "@/lib/health";
import type { SavingsProfile } from "@/lib/savings-plan";
import type { EarningProfile } from "@/lib/earning-plan";
import { aiConfigFromBody } from "@/lib/ai-providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const deadline = String(body.deadline || "").trim();

    if (!title || !deadline) {
      return NextResponse.json(
        { error: "title and deadline are required" },
        { status: 400 }
      );
    }

    const allowed = new Set([
      "general",
      "weight_loss",
      "health",
      "longevity",
      "mindset",
      "savings",
      "income",
      "fitness",
      "learning",
      "career",
      "habit",
      "creative",
      "relationship",
      "home",
    ]);
    const rawCat = String(body.category || "");
    const category = allowed.has(rawCat)
      ? (rawCat as import("@/lib/types").GoalCategory)
      : undefined;

    const plan = await generatePlan({
      title,
      description: body.description ? String(body.description) : undefined,
      deadline,
      success_metrics: body.success_metrics
        ? String(body.success_metrics)
        : undefined,
      busySlots: Array.isArray(body.busySlots)
        ? (body.busySlots as BusySlot[])
        : undefined,
      category,
      health_profile: body.health_profile
        ? (body.health_profile as WeightLossProfile)
        : undefined,
      savings_profile: body.savings_profile
        ? (body.savings_profile as SavingsProfile)
        : undefined,
      earning_profile: body.earning_profile
        ? (body.earning_profile as EarningProfile)
        : undefined,
      ai: aiConfigFromBody(body),
    });

    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate plan" },
      { status: 500 }
    );
  }
}
