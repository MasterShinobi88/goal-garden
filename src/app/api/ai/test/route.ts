import { NextResponse } from "next/server";
import {
  aiConfigFromBody,
  chatCompletion,
  resolveAIConfig,
} from "@/lib/ai-providers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const partial = aiConfigFromBody(body);
    const config = resolveAIConfig(partial);

    if (config.provider === "mock") {
      return NextResponse.json({
        ok: true,
        provider: "mock",
        model: "mock",
        message:
          "Mock AI is active (no live key). Pick a provider and add an API key to connect.",
      });
    }

    const result = await chatCompletion(
      [
        {
          role: "user",
          content:
            'Reply with exactly: Goal Garden connected. (one short sentence is fine)',
        },
      ],
      { config: partial, temperature: 0 }
    );

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      message: `Connected · ${result.provider} · ${result.model} · “${result.text.slice(0, 80)}"`,
      sample: result.text.slice(0, 200),
    });
  } catch (err) {
    console.error("AI test failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not reach the AI provider. Check key, model, and base URL.",
      },
      { status: 400 }
    );
  }
}
