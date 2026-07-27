/**
 * High-quality offline mock coach.
 * Parses intent, pulls garden context, and answers specifically — not only keyword dumps.
 */

export type ParsedGarden = {
  streak: number;
  activeGoals: number;
  water: { current: number; target: number } | null;
  kcal: { eaten: number | null; target: number | null } | null;
  movementDone: boolean | null;
  movementPending: boolean;
  goals: {
    title: string;
    progress: number;
    hasHealth: boolean;
    macros?: string;
    waterL?: string;
    homeWorkouts?: boolean;
    todayOpen: string[];
    todayDone: string[];
  }[];
  firstOpenTask: string | null;
  isWeightLossFocused: boolean;
};

export function parseGardenContext(context: string): ParsedGarden {
  const lines = context.split("\n").map((l) => l.trim()).filter(Boolean);
  let streak = 0;
  let activeGoals = 0;
  let water: ParsedGarden["water"] = null;
  let kcal: ParsedGarden["kcal"] = null;
  let movementDone: boolean | null = null;

  const streakM = context.match(/Day streak:\s*(\d+)/i);
  if (streakM) streak = Number(streakM[1]);
  const agM = context.match(/Active goals:\s*(\d+)/i);
  if (agM) activeGoals = Number(agM[1]);

  const waterM = context.match(/water\s+(\d+)\/(\d+)/i);
  if (waterM) water = { current: Number(waterM[1]), target: Number(waterM[2]) };

  const kcalM = context.match(
    /kcal logged\s+([—\-\d]+)\s*\/\s*target\s+([—\-\d]+)/i
  );
  if (kcalM) {
    const eaten =
      kcalM[1] === "—" || kcalM[1] === "-" ? null : Number(kcalM[1]);
    const target =
      kcalM[2] === "—" || kcalM[2] === "-" ? null : Number(kcalM[2]);
    kcal = { eaten, target };
  }

  if (/movement done/i.test(context)) movementDone = true;
  else if (/movement not yet/i.test(context)) movementDone = false;

  const goals: ParsedGarden["goals"] = [];
  let current: ParsedGarden["goals"][0] | null = null;

  for (const line of lines) {
    const gm = line.match(/^Goal "(.+?)" — (\d+)% complete/);
    if (gm) {
      if (current) goals.push(current);
      current = {
        title: gm[1],
        progress: Number(gm[2]),
        hasHealth: false,
        todayOpen: [],
        todayDone: [],
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("Nutrition:")) {
      current.hasHealth = true;
      current.macros = line.replace(/^Nutrition:\s*/i, "");
      const wl = line.match(/water\s+([\d.]+)L/i);
      if (wl) current.waterL = wl[1];
      current.homeWorkouts = /home workouts:\s*true/i.test(line);
    }
    if (line.startsWith("Today tasks:")) {
      const parts = line.replace(/^Today tasks:\s*/i, "").split(";");
      for (const p of parts) {
        const t = p.trim();
        if (t.startsWith("✓")) current.todayDone.push(t.replace(/^✓\s*/, ""));
        else if (t.startsWith("○"))
          current.todayOpen.push(t.replace(/^○\s*/, ""));
      }
    }
  }
  if (current) goals.push(current);

  const allOpen = goals.flatMap((g) => g.todayOpen);
  const isWeightLossFocused = goals.some(
    (g) =>
      g.hasHealth ||
      /weight|lose|slim|fat|diet|fit/i.test(g.title)
  );

  return {
    streak,
    activeGoals,
    water,
    kcal,
    movementDone,
    movementPending: movementDone === false,
    goals,
    firstOpenTask: allOpen[0] ?? null,
    isWeightLossFocused,
  };
}

type Intent =
  | "distilled_water"
  | "sparkling_water"
  | "coffee_tea"
  | "electrolytes"
  | "alkaline_water"
  | "tap_water"
  | "water_habit"
  | "hunger"
  | "protein"
  | "calories"
  | "macros"
  | "cheat_meal"
  | "plateau"
  | "sleep"
  | "stress"
  | "workout"
  | "sore"
  | "steps"
  | "missed"
  | "motivation"
  | "streak"
  | "what_next"
  | "progress"
  | "compare"
  | "how_app"
  | "greeting"
  | "thanks"
  | "medical"
  | "alcohol"
  | "intermittent_fasting"
  | "scale_weight"
  | "meal_ideas"
  | "shopping"
  | "general";

function detectIntents(lower: string): Intent[] {
  const found: Intent[] = [];
  const add = (i: Intent, re: RegExp) => {
    if (re.test(lower)) found.push(i);
  };

  add("greeting", /^(hi|hello|hey|good morning|good evening|yo)\b/);
  add("thanks", /\b(thanks|thank you|thx|appreciate)\b/);
  add("medical", /\b(diagnos|prescri|doctor|medic|condition|disease|pain in chest|blood pressure|diabetes)\b/);
  add("distilled_water", /distill|deminerali[sz]ed|reverse\s*osmosis|\bro\b.*water|water.*\bro\b/);
  add("sparkling_water", /sparkling|seltzer|carbonated|la croix|soda water/);
  add("coffee_tea", /(coffee|tea|espresso|latte).*(count|hydrat|water|instead)|does (coffee|tea) count/);
  add("electrolytes", /electrolyte|lmnt|pedialyte|sodium|potassium.*water|salt.*water/);
  add("alkaline_water", /alkaline|hydrogen water|ionized/);
  add("tap_water", /tap water|bottled water|filter(ed)? water|is tap/);
  add("water_habit", /hydrat|drink more water|water goal|forget to drink|don't drink enough|water habit|how much water|how many glasses/);
  add("hunger", /hungr|craving|snack attack|starve|appetite|late.?night eat/);
  add("protein", /\bprotein\b|chicken|whey|greek yogurt/);
  add("calories", /calor|kcal|deficit|surplus|how much should i eat/);
  add("macros", /\bmacros?\b|carbs?|fat grams|carb/);
  add("cheat_meal", /cheat|binge|slip.?up|ate too much|pizza night/);
  add("plateau", /plateau|stall|not losing|scale stuck|no progress/);
  add("sleep", /sleep|insomnia|tired all day|rest/);
  add("stress", /stress|anxious|anxiety|overwhelm|burnout/);
  add("workout", /workout|exercise|gym|train|lift|run|walk|cardio|home workout|movement/);
  add("sore", /sore|doms|muscle pain|recovery/);
  add("steps", /steps|10k|walking/);
  add("missed", /miss(ed)?|behind|fail|guilt|skipped|relapse|fell off/);
  add("motivation", /motivat|stuck|lazy|can't start|procrastin|help me start/);
  add("streak", /streak|grace day|consecutive/);
  add("what_next", /what (should|can) i do|what.?s next|next task|today|focus/);
  add("progress", /progress|how am i|am i doing|status|summary|check.?in/);
  add("how_app", /how (do|does) (this|the app|goal garden)|hud|progress tree|how to use/);
  add("alcohol", /alcohol|beer|wine|drink(ing)? (tonight|alcohol)|hangover/);
  add("intermittent_fasting", /intermittent|fasting|\bif\b.*window|16:8|omad/);
  add("scale_weight", /weigh.?in|scale|body weight|lbs|kg lost/);
  add("meal_ideas", /meal idea|what (to|should i) eat|recipe|breakfast|lunch|dinner idea/);
  add("shopping", /grocery|shopping list|meal prep|prep food/);
  add("compare", /better than|vs\.?|versus|or should i|difference between/);

  if (found.length === 0) found.push("general");
  return found;
}

function gardenSnapshot(g: ParsedGarden): string {
  const bits: string[] = [];
  if (g.streak > 0) bits.push(`${g.streak}-day streak`);
  if (g.water)
    bits.push(`water ${g.water.current}/${g.water.target}`);
  if (g.kcal?.target != null)
    bits.push(
      g.kcal.eaten != null
        ? `kcal ${g.kcal.eaten}/${g.kcal.target}`
        : `kcal target ${g.kcal.target}`
    );
  if (g.movementDone === true) bits.push("movement ✓");
  if (g.movementDone === false) bits.push("movement still open");
  if (g.firstOpenTask)
    bits.push(`next task: “${truncate(g.firstOpenTask, 48)}”`);
  if (g.goals[0])
    bits.push(`“${truncate(g.goals[0].title, 40)}” at ${g.goals[0].progress}%`);

  if (bits.length === 0) {
    return "Your garden is quiet so far — plant a goal or load a demo to personalize coaching.";
  }
  return `**Your garden right now:** ${bits.join(" · ")}`;
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

function answerIntent(intent: Intent, garden: ParsedGarden, lower: string): string {
  const snap = gardenSnapshot(garden);
  const healthGoal = garden.goals.find((g) => g.hasHealth);

  switch (intent) {
    case "greeting":
      return `Hey — good to see you in the garden.\n\n${snap}\n\n${
        garden.firstOpenTask
          ? `If you want one move: start with **${garden.firstOpenTask}**.`
          : garden.water && garden.water.current < garden.water.target
            ? `A simple win: pour a glass and tap the HUD (${garden.water.current}/${garden.water.target}).`
            : "Ask me anything — hunger, workouts, water types, missed days, or what to do next."
      }`;

    case "thanks":
      return `You’re welcome. Keep going one leaf at a time.\n\n${snap}`;

    case "medical":
      return `That’s outside what a productivity/nutrition coach should decide.\n\nI can help with **habits** (meals, water, movement, planning), but symptoms, diagnoses, meds, or conditions belong with a clinician.\n\nIf you’re in distress or have urgent symptoms, seek local emergency care.\n\n${snap}`;

    case "distilled_water":
      return `**Yes — distilled (and RO) water still hydrates you** the same way for your Goal Garden water target.

**What actually matters for benefits people want from “drinking more water”:**
• Fluid **volume** (the HUD glasses), consistency, and often replacing sugary drinks
• Not the purity marketing story

**Minerals:** most calcium/magnesium etc. come from **food**, not water. On a normal diet, distilled water is fine for most people.

**Caveats (honest, not fear-based):**
• Taste can be flat — if that means you drink *less*, switch to whatever you’ll finish
• Heavy sweat days may feel better with a little sodium from food/broth/electrolytes
• Extreme dieting + only demineralized water → talk to a clinician about overall intake
• Not a detox or superior fat-loss liquid

**Log it the same:** tap a glass for distilled, tap, or filtered. ${
        garden.water
          ? `You’re at **${garden.water.current}/${garden.water.target}** today.`
          : "Use the Daily HUD on the dashboard."
      }\n\n${snap}`;

    case "sparkling_water":
      return `**Unsweetened sparkling water counts** toward hydration for most people.

• Sugar-free seltzer → log glasses  
• Juice-sweetened “sparkling” → hydration + calories  
• Bloaty? Mix still + sparkling  

${snap}`;

    case "coffee_tea":
      return `Coffee/tea **add some fluid**, but don’t fully replace your water goal.

• Regular coffee drinkers aren’t “dehydrated” by coffee in the old myth sense  
• Caffeine + milk/sugar are separate variables  
• Best practice here: HUD glasses = plain water (or unsweetened sparkling); coffee is extra  

${
        garden.water && garden.water.current < 2
          ? "Try 1–2 real water glasses before more coffee."
          : ""
      }\n\n${snap}`;

    case "electrolytes":
      return `Electrolytes are **situational**, not a daily requirement for fat loss.

• Normal day: food + water goal is usually enough  
• Heavy sweat / heat / hard training / very low carb: a bit of sodium helps many people  
• Skip sugar-bomb sports drinks if you’re in a deficit  

${snap}`;

    case "alkaline_water":
      return `Specialty waters are mostly marketing for healthy people.

Hydration still = **enough fluid**. Alkaline/hydrogen claims rarely beat plain water for weight loss. Spend attention on protein, sleep, and your calorie target instead.\n\n${snap}`;

    case "tap_water":
      return `**Tap vs bottled vs filter** is mostly taste + local safety — not a fat-loss lever.

Safe tap you like = best default. Filter if taste helps you drink more. Distilled/RO still hydrates (minerals mainly from food).\n\n${snap}`;

    case "water_habit": {
      const w = garden.water;
      const remaining = w ? Math.max(0, w.target - w.current) : null;
      return `Let’s make water automatic.

${
        w
          ? `Today: **${w.current}/${w.target} glasses**${remaining ? ` · ${remaining} to go` : " · target hit 🎉"}.`
          : "Open the Daily HUD and set your glass target (weight-loss plans fill this automatically)."
      }

**Simple system:**
1. 2 glasses before noon  
2. 1 glass with each meal  
3. 1 glass mid-afternoon  
4. Tap the HUD when you drink — don’t rely on memory  

Still, sparkling, filtered, or distilled all count. Consistency > perfection.\n\n${snap}`;
    }

    case "hunger":
      return `Hunger is information, not failure.

**Quick stack:**
1. Protein + fiber first (Greek yogurt, eggs, tofu, chicken + veg)  
2. Water/tea — thirst can masquerade as hunger  
3. If still hungry and under target, eat a planned snack — don’t white-knuckle  

${
        garden.kcal?.target != null
          ? `Your plan target is ~**${garden.kcal.target} kcal**${
              garden.kcal.eaten != null
                ? `; logged **${garden.kcal.eaten}** (remaining **${garden.kcal.target - garden.kcal.eaten}**)`
                : ""
            }.`
          : "Log kcal on the Daily HUD if you have a weight-loss plan."
      }

Late-night: brush teeth + herbal tea + decide tomorrow’s breakfast. Sleep debt makes cravings louder.\n\n${snap}`;

    case "protein":
      return `Protein is the quiet MVP for fat loss and fullness.

${
        healthGoal?.macros
          ? `Your plan notes: **${healthGoal.macros}** — aim to spread protein across meals.`
          : "A common target is ~1.6–2.0 g per kg of goal body weight (your plan computes this when you create a weight-loss goal)."
      }

Easy hits: eggs, Greek yogurt, cottage cheese, chicken, fish, tofu, lentils, whey if you like it.\n\n${snap}`;

    case "calories":
      return `Calories are a budget, not a moral score.

${
        garden.kcal?.target != null
          ? `Your estimated daily target is **~${garden.kcal.target} kcal** (from your healthy plan — not a crash diet).`
          : "Create a weight-loss goal with body stats to generate a personalized calorie estimate."
      }

• Prefer a **moderate** deficit you can live with  
• If energy crashes for days, nudge +100 kcal and reassess  
• Weekly average matters more than one day  

Not medical advice — special conditions need a clinician.\n\n${snap}`;

    case "macros":
      return `Macros = protein, carbs, fat split inside your calories.

${
        healthGoal?.macros
          ? `Yours: **${healthGoal.macros}**`
          : "Weight-loss goals in Goal Garden set protein-forward macros automatically."
      }

Priority order: **hit protein** → stay near calories → let carbs/fat flex for preference and training.\n\n${snap}`;

    case "cheat_meal":
      return `One big meal doesn’t erase a week of consistency.

1. Drop the guilt script  
2. Don’t “compensate” with starvation tomorrow  
3. Return to protein + produce + water at the next meal  
4. Optional: short walk for blood sugar/mood — not punishment  

${snap}`;

    case "plateau":
      return `Plateaus are common — not proof you’ve failed.

Check for 1–2 weeks:
• Protein consistency  
• Weekend calorie creep  
• Sleep <7h  
• Stress  
• Scale noise (water, sodium, cycle) — use weekly averages  

If truly stalled: small tweak (−100–150 kcal **or** +1 walk), not a crash. Non-scale wins still count (energy, clothes, strength).\n\n${snap}`;

    case "sleep":
      return `Sleep is a fat-loss and motivation multiplier.

• 7–9h target  
• Caffeine cutoff ~8h before bed  
• Dim screens last hour  
• Same wake time most days  

Poor sleep → louder hunger + weaker workouts. Protect it like a milestone.\n\n${snap}`;

    case "stress":
      return `When stress is high, shrink the plan — don’t abandon it.

**Minimum viable day:** water goal + one 10-minute walk + one protein-forward meal.  
Skip perfection. Use weekly grace if needed.\n\n${snap}`;

    case "workout": {
      const home =
        healthGoal?.homeWorkouts ||
        garden.goals.some((g) => g.homeWorkouts);
      if (home || /home|no equipment|beginner|sedentary/i.test(lower)) {
        return `Here’s a **no-equipment** session (~12 min):

1. March or walk in place — 3 min  
2. Sit-to-stand squats × 10  
3. Wall or knee push-ups × 8  
4. Plank 20 seconds  
5. Easy stretch — 2 min  

Do it once, mark **Movement** on the Daily HUD${
          garden.movementDone === true ? " (already done today — nice)" : ""
        }.\n\n${snap}`;
      }
      return `Keep training sustainable:

• 2–3 strength sessions/week + easy walks  
• If drained: swap intensity for a 15-min walk  
• Mark movement on the HUD so the habit sticks  

${garden.movementPending ? "Movement is still open on today’s HUD." : ""}\n\n${snap}`;
    }

    case "sore":
      return `Soreness (DOMS) often peaks 24–48h after new work.

• Easy walk and mobility beat total rest for mild soreness  
• Sleep + protein help recovery  
• Sharp joint pain ≠ normal soreness — ease off and consider a pro  

${snap}`;

    case "steps":
      return `Walking is underrated for fat loss and mood.

• Start where you are; add +1–2k steps when easy  
• Post-meal 10-minute walks help many people  
• Counts as movement on the HUD  

${snap}`;

    case "missed":
      return `Missed days don’t kill the tree — harsh restarts do.

1. Reschedule **1–2** tasks only (not the whole backlog)  
2. Minimum viable day: water + one micro-task  
3. Use your **weekly grace day** if life got loud  
4. No punishment workouts or crash diets  

${
        garden.firstOpenTask
          ? `Soft restart: **${garden.firstOpenTask}**`
          : "Open your goal and check one box."
      }\n\n${snap}`;

    case "motivation":
      return `Motivation follows action more often than it leads it.

**Do the 2-minute version:**
${
        garden.firstOpenTask
          ? `• Start: ${garden.firstOpenTask}`
          : "• Tap one water glass or mark a 10-minute walk"
      }
• Then reassess — usually the next step feels lighter  

${snap}`;

    case "streak":
      return `Streaks reward showing up — not perfection.

• Completing **any** task today can continue your streak  
• **One grace day per week** softens a single miss  
• Current streak: **${garden.streak}** day(s)  

${snap}`;

    case "what_next":
      return `**Best next leaf:**

${
        garden.water && garden.water.current < Math.ceil(garden.water.target / 2)
          ? `1. Water — ${garden.water.current}/${garden.water.target} (front-load a couple glasses)\n`
          : ""
      }${
        garden.movementPending
          ? "2. Mark movement after a short walk or home circuit\n"
          : ""
      }${
        garden.firstOpenTask
          ? `3. Task: **${garden.firstOpenTask}**\n`
          : "3. Open a goal and complete one micro-task\n"
      }
That’s enough for a strong day.\n\n${snap}`;

    case "progress": {
      if (garden.goals.length === 0) {
        return `No active goals yet — plant one or load **Demo weight loss** / **Demo project** to see the tree grow.\n\n${snap}`;
      }
      const list = garden.goals
        .map(
          (g) =>
            `• **${g.title}** — ${g.progress}%${
              g.todayOpen.length
                ? ` · ${g.todayOpen.length} open today`
                : g.todayDone.length
                  ? " · today’s tasks clear"
                  : ""
            }`
        )
        .join("\n");
      return `**Progress check-in**\n\n${list}\n\n${snap}\n\nCelebrate any box already checked. One more leaf is a win.`;
    }

    case "how_app":
      return `Quick tour of Goal Garden:

• **Dashboard** — goals, progress tree, Daily HUD (water / kcal / movement)  
• **Goal page** — milestones, tasks, health plan, share/PDF  
• **Coach** — me (mock offline, or your connected AI)  
• **Calendar** — tasks + busy times  
• Completing tasks grows the tree and can fire a celebration  

${snap}`;

    case "alcohol":
      return `Alcohol is optional — plan around it kindly.

• Liquid calories add up; they don’t “require” punishment the next day  
• Hydrate before/after; prioritize protein at meals  
• Sleep quality often drops — expect hungrier next day  

One night ≠ failure. Next meal back to normal.\n\n${snap}`;

    case "intermittent_fasting":
      return `IF can work **if** it helps you hit calories/protein — it’s not magic.

• 16:8 is common; still hit protein and water  
• If IF increases binge risk or stress, drop it  
• Your calorie target still applies across the day  

${snap}`;

    case "scale_weight":
      return `The scale is noisy (water, sodium, hormones, timing).

• Weigh **weekly** under similar conditions  
• Trend > single day  
• Track non-scale wins too  

${
        healthGoal
          ? "Your plan expects a **gentle** weekly pace — not crash loss."
          : ""
      }\n\n${snap}`;

    case "meal_ideas": {
      const p = healthGoal?.macros?.match(/P\s*(\d+)g/i)?.[1];
      return `Simple plates that fit a healthy deficit:

• **Breakfast:** eggs or Greek yogurt + fruit + whole grain ${p ? `(~⅓ of ~${p}g protein)` : ""}  
• **Lunch:** lean protein + big vegetables + rice/potato  
• **Dinner:** same plate method + olive oil or avocado for fat  
• **Snack:** cottage cheese, hummus + veg, apple + handful nuts  

${healthGoal?.macros ? `Stay near: **${healthGoal.macros}**` : "Create a weight-loss goal for personalized macros."}\n\n${snap}`;
    }

    case "shopping":
      return `**Protein-first grocery list**

• Eggs, Greek yogurt, chicken/tofu/fish  
• Frozen veg, salad greens, fruit  
• Oats/rice/potatoes  
• Beans/lentils  
• Olive oil, spices  

Prep 2 proteins + chopped veg once → easier weekdays.\n\n${snap}`;

    case "compare":
      return `When comparing options, use this filter:

1. Will I **actually do it** for 4+ weeks?  
2. Does it keep protein, sleep, and a moderate calorie range intact?  
3. Is it safe for me personally (clinician if unsure)?  

Extreme usually loses to boring consistency.\n\n${snap}`;

    case "general":
    default: {
      const q =
        lower.length > 100 ? `${lower.slice(0, 97)}…` : lower;
      return `You asked about: “${q}”

I don’t have live web search in mock mode, but here’s a practical coach take:

${
        garden.isWeightLossFocused
          ? "• For **body/weight goals**: volume of water, protein, sleep, and a moderate calorie target beat gimmicks.\n• For **habits**: shrink the action until it’s easy to start."
          : "• Break the problem into one next physical action under 15 minutes.\n• Protect sleep and calendar focus blocks if this is a project goal."
      }
${
        garden.firstOpenTask
          ? `\n• Concrete next step already on your list: **${garden.firstOpenTask}**`
          : ""
      }

${snap}

Try a sharper follow-up — e.g. *distilled water*, *late-night hunger*, *12-min home workout*, *I missed 2 days*, or *what should I do next?*`;
    }
  }
}

/** Compose final mock reply — multi-intent aware, garden-grounded */
export function improvedMockCoachReply(
  userMessage: string,
  context: string
): string {
  const lower = userMessage.toLowerCase().trim();
  if (!lower) {
    return "I’m here — ask about water, hunger, workouts, progress, or what to do next.";
  }

  const garden = parseGardenContext(context);
  const intents = detectIntents(lower);

  // Prefer most specific non-general intents
  const primary =
    intents.find((i) => i !== "general" && i !== "greeting" && i !== "thanks") ||
    intents[0];

  // Combine closely related pairs lightly
  let body = answerIntent(primary, garden, lower);

  // If they asked two things (e.g. distilled + hunger), append short second answer
  const secondary = intents.find(
    (i) =>
      i !== primary &&
      i !== "general" &&
      i !== "greeting" &&
      i !== "compare"
  );
  if (
    secondary &&
    ["distilled_water", "hunger", "workout", "water_habit", "protein"].includes(
      secondary
    )
  ) {
    const second = answerIntent(secondary, garden, lower);
    // Only first paragraph-ish of second to avoid walls of text
    const short = second.split("\n\n").slice(0, 2).join("\n\n");
    body += `\n\n---\nAlso on **${secondary.replace(/_/g, " ")}:**\n${short}`;
  }

  return body;
}
