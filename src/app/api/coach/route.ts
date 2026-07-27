import { NextResponse } from "next/server";
import { COACH_SYSTEM, mockCoachReply } from "@/lib/coach";
import {
  aiConfigFromBody,
  chatCompletion,
  hasLiveAI,
  type ChatMessage,
} from "@/lib/ai-providers";

export async function POST(request: Request) {
  let message = "";
  let context = "";
  let history: { role: string; content: string }[] = [];
  let aiPartial = {};

  try {
    const body = await request.json();
    message = String(body.message || "").trim();
    context = String(body.context || "");
    history = Array.isArray(body.history)
      ? (body.history as { role: string; content: string }[]).slice(-12)
      : [];
    aiPartial = aiConfigFromBody(body);

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    if (!hasLiveAI(aiPartial)) {
      return NextResponse.json({
        reply: mockCoachReply(message, context),
        provider: "mock",
      });
    }

    const messages: ChatMessage[] = [
      { role: "system", content: COACH_SYSTEM },
      {
        role: "system",
        content: `User garden context:\n${context || "No goals yet."}`,
      },
      ...history.map((h) => ({
        role: (h.role === "assistant" ? "assistant" : "user") as
          | "user"
          | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const result = await chatCompletion(messages, {
      config: aiPartial,
      temperature: 0.5,
    });

    return NextResponse.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      reply: mockCoachReply(message || "help", context),
      provider: "mock-fallback",
      error: err instanceof Error ? err.message : "AI error",
    });
  }
}
