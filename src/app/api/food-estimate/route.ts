import { NextResponse } from "next/server";
import {
  chatCompletion,
  hasLiveAI,
  aiConfigFromBody,
} from "@/lib/ai-providers";
import { resolveQuickLine, searchFoods, scaleFood } from "@/lib/food-db";

/**
 * Estimate calories for a food line.
 * 1) Local DB match
 * 2) Connected AI (if any)
 * 3) Heuristic mock estimate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const line = String(body.line || body.query || "").trim();
    const amount = body.amount != null ? Number(body.amount) : undefined;
    const unit = body.unit ? String(body.unit) : undefined;
    const ai = aiConfigFromBody(body);

    if (!line) {
      return NextResponse.json({ error: "line required" }, { status: 400 });
    }

    // Prefer local DB
    const quick =
      amount != null
        ? (() => {
            const hits = searchFoods(line, 3);
            if (!hits.length) return null;
            const food = hits[0];
            let amt = amount;
            if (unit === "g" && (food.unit === "each" || food.unit === "slice") && food.gramsPerUnit) {
              amt = amount / food.gramsPerUnit;
            }
            return { food, amount: amt, macros: scaleFood(food, amt) };
          })()
        : resolveQuickLine(line);

    if (quick) {
      return NextResponse.json({
        source: "db",
        name: quick.food.name,
        amount: quick.amount,
        unit: quick.food.unit,
        amountLabel: formatAmount(quick.amount, quick.food.unit),
        macros: quick.macros,
        confidence: "high",
      });
    }

    // Live AI estimate
    if (hasLiveAI(ai)) {
      try {
        const result = await chatCompletion(
          [
            {
              role: "system",
              content:
                'You estimate nutrition. Return ONLY JSON: {"name":string,"amountLabel":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"confidence":"low"|"medium"|"high"}. Use common USDA-like averages. Not medical advice.',
            },
            {
              role: "user",
              content: `Estimate macros for: ${line}${amount != null ? ` amount=${amount} ${unit || ""}` : ""}`,
            },
          ],
          { config: ai, temperature: 0.2 }
        );
        const parsed = parseJson(result.text);
        if (parsed) {
          return NextResponse.json({
            source: "ai",
            provider: result.provider,
            name: parsed.name,
            amountLabel: parsed.amountLabel,
            macros: {
              kcal: Math.round(parsed.kcal),
              protein_g: round1(parsed.protein_g),
              carbs_g: round1(parsed.carbs_g),
              fat_g: round1(parsed.fat_g),
            },
            confidence: parsed.confidence || "medium",
          });
        }
      } catch (err) {
        console.error("AI food estimate failed", err);
      }
    }

    // Heuristic mock
    const mock = heuristicEstimate(line, amount, unit);
    return NextResponse.json({
      source: "estimate",
      ...mock,
      confidence: "low",
      note: "Approximate only — pick a DB match or connect AI in Settings for better estimates.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Estimate failed" },
      { status: 500 }
    );
  }
}

function formatAmount(amount: number, unit: string) {
  const a = Math.round(amount * 100) / 100;
  return `${a} ${unit}`;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function parseJson(text: string): {
  name: string;
  amountLabel: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: string;
} | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);
    if (typeof data.kcal !== "number") return null;
    return data;
  } catch {
    return null;
  }
}

function heuristicEstimate(
  line: string,
  amount?: number,
  unit?: string
) {
  const lower = line.toLowerCase();
  // Very rough kcal density per 100g by keyword
  let kcalPer100 = 150;
  let p = 8;
  let c = 15;
  let f = 5;
  if (/oil|butter|mayo/.test(lower)) {
    kcalPer100 = 700;
    p = 0;
    c = 0;
    f = 78;
  } else if (/nut|almond|peanut|seed/.test(lower)) {
    kcalPer100 = 580;
    p = 20;
    c = 20;
    f = 50;
  } else if (/chip|fry|fried|pizza|burger|cake|cookie|candy/.test(lower)) {
    kcalPer100 = 320;
    p = 6;
    c = 40;
    f = 15;
  } else if (/chicken|beef|fish|meat|tofu|egg|turkey/.test(lower)) {
    kcalPer100 = 180;
    p = 25;
    c = 0;
    f = 8;
  } else if (/rice|pasta|bread|oat|potato/.test(lower)) {
    kcalPer100 = 140;
    p = 4;
    c = 28;
    f = 1;
  } else if (/salad|broccoli|spinach|veg|lettuce|cucumber/.test(lower)) {
    kcalPer100 = 30;
    p = 2;
    c = 5;
    f = 0.3;
  } else if (/fruit|apple|berry|banana/.test(lower)) {
    kcalPer100 = 60;
    p = 0.5;
    c = 15;
    f = 0.2;
  }

  let grams = amount ?? 100;
  if (unit === "oz") grams = (amount ?? 1) * 28.35;
  if (unit === "each" || unit === "slice") grams = (amount ?? 1) * 50;
  if (unit === "tbsp") grams = (amount ?? 1) * 14;
  if (unit === "cup") grams = (amount ?? 1) * 150;

  const factor = grams / 100;
  return {
    name: line,
    amountLabel: `${Math.round(grams)} g (approx)`,
    macros: {
      kcal: Math.round(kcalPer100 * factor),
      protein_g: round1(p * factor),
      carbs_g: round1(c * factor),
      fat_g: round1(f * factor),
    },
  };
}
