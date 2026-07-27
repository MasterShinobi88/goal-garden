/**
 * Domain-aware mock goal planner — better than generic "build foundation" templates.
 */
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { BusySlot, GeneratedPlan } from "./types";

export type GoalDomain =
  | "weight_loss"
  | "fitness"
  | "learning"
  | "career"
  | "creative"
  | "finance"
  | "habit"
  | "relationship"
  | "home"
  | "longevity"
  | "mindset"
  | "general";

export function detectGoalDomain(
  title: string,
  description = "",
  category?: string
): GoalDomain {
  // Explicit category from goal type picker wins
  switch (category) {
    case "weight_loss":
      return "weight_loss";
    case "savings":
      return "finance";
    case "income":
      return "career";
    case "fitness":
      return "fitness";
    case "learning":
      return "learning";
    case "career":
      return "career";
    case "creative":
      return "creative";
    case "habit":
    case "health":
      return "habit";
    case "longevity":
      return "longevity";
    case "mindset":
      return "mindset";
    case "relationship":
      return "relationship";
    case "home":
      return "home";
    case "general":
      break; // fall through to text detect
    default:
      break;
  }

  const t = `${title} ${description}`.toLowerCase();

  if (/weight|lose|slim|fat loss|diet|calorie|bmi|body fat/.test(t))
    return "weight_loss";
  if (
    /longevity|anti-?ag(e|ing)|healthspan|lifespan|blue zone|biological age|zone 2|vo2|healthspan/.test(
      t
    )
  )
    return "longevity";
  if (
    /mindset|mental health|meditat|gratitude|anxiety|growth mindset|stoic|mindful|resilien|self-?talk/.test(
      t
    )
  )
    return "mindset";
  if (
    /run|marathon|lift|gym|fitness|muscle|strength|5k|yoga|sport|training/.test(
      t
    )
  )
    return "fitness";
  if (
    /learn|study|course|exam|certif|language|read \d|skill|coding|programming/.test(
      t
    )
  )
    return "learning";
  if (
    /earn|get\s+(a\s+)?job|find\s+(a\s+)?job|make\s+money|income|hired|job|career|promot|interview|resume|portfolio|side hustle|business|startup|launch|product|ship/.test(
      t
    )
  )
    return "career";
  if (
    /write|book|novel|art|music|paint|film|creative|design|blog|youtube|content/.test(
      t
    )
  )
    return "creative";
  if (/save|debt|budget|invest|emergency fund|pay off|\$\d+|₱/.test(t))
    return "finance";
  if (
    /habit|journal|sleep|screen time|quit|sober|morning routine|hydrat|checkup/.test(
      t
    )
  )
    return "habit";
  if (/family|relationship|date night|friend|partner|kids|parents/.test(t))
    return "relationship";
  if (/home|clean|renovat|garden|move house|organize|declutter/.test(t))
    return "home";
  return "general";
}

type WeekTpl = { title: string; tasks: { title: string; notes?: string }[] };

function templatesFor(
  domain: GoalDomain,
  title: string,
  metrics?: string
): WeekTpl[] {
  const short = title.length > 48 ? `${title.slice(0, 45)}…` : title;
  const m = metrics ? ` Success: ${metrics.slice(0, 60)}` : "";

  const map: Record<GoalDomain, WeekTpl[]> = {
    weight_loss: [
      {
        title: "Week 1 — Foundations (not perfection)",
        tasks: [
          { title: "Log meals roughly for 3 days", notes: "Awareness first" },
          { title: "Hit water goal most days", notes: "Use Daily HUD glasses" },
          { title: "Protein at each meal", notes: "Eggs, yogurt, tofu, meat…" },
          { title: "10-minute walk after one meal", notes: "No gym required" },
          { title: "Baseline weigh-in (weekly only)", notes: "Same conditions" },
          { title: "Sleep target 7h+ for 3 nights" },
        ],
      },
      {
        title: "Week 2 — Rhythm",
        tasks: [
          { title: "Grocery list: protein + produce first" },
          { title: "Cook one simple high-protein dinner" },
          { title: "Home circuit or walk 3× this week" },
          { title: "Water streak: 4 solid days" },
          { title: "Review hunger vs boredom once" },
          { title: "Weekly weigh-in — trend not drama" },
        ],
      },
      {
        title: "Week 3 — Consistency",
        tasks: [
          { title: "Prep protein for 2 days" },
          { title: "Half-plate vegetables at lunch & dinner" },
          { title: "Movement after dinner 2×" },
          { title: "One flexible social meal without all-or-nothing" },
          { title: "Protect sleep on two weeknights" },
          { title: "Non-scale win note (energy, clothes, mood)" },
        ],
      },
      {
        title: "Week 4 — Sustainable lifestyle",
        tasks: [
          { title: "Adjust calories ±100 only if energy is poor" },
          { title: "Keep strength or bodyweight 2×" },
          { title: "Water habit automatic" },
          { title: "Plan next checkpoint toward goal weight" },
          { title: "Celebrate consistency, not a single number" },
        ],
      },
      {
        title: "Ongoing — Protect progress",
        tasks: [
          { title: "Monthly habit review" },
          { title: "Keep protein + walking non-negotiable" },
          { title: "Restart gently after imperfect weeks" },
        ],
      },
    ],
    fitness: [
      {
        title: `Week 1 — Baseline for “${short}”`,
        tasks: [
          { title: "Write current fitness baseline honestly" },
          { title: "Schedule 3 training sessions on calendar" },
          { title: "Buy/prepare shoes or space if needed" },
          { title: "Do first easy session (stop early if needed)" },
          { title: "Log how you felt after", notes: m || undefined },
          { title: "Sleep 7h+ before next hard day" },
        ],
      },
      {
        title: "Week 2 — Build the habit",
        tasks: [
          { title: "Complete planned sessions (quality over ego)" },
          { title: "Add one mobility or stretch day" },
          { title: "Protein-forward meal on training days" },
          { title: "Easy walk on a rest day" },
          { title: "Note one form cue to improve" },
        ],
      },
      {
        title: "Week 3 — Progressive overload",
        tasks: [
          { title: "Increase volume or intensity slightly" },
          { title: "Film or checklist one lift/run segment" },
          { title: "Hydrate around sessions" },
          { title: "Full rest or active recovery day" },
          { title: "Mid-goal check: energy & aches" },
        ],
      },
      {
        title: "Week 4 — Prove consistency",
        tasks: [
          { title: "Hit weekly session target" },
          { title: "Test a benchmark (time, reps, distance)" },
          { title: "Plan deload or easier week if needed" },
          { title: "Reflect: what schedule actually worked?" },
        ],
      },
      {
        title: "Finish line — Own the routine",
        tasks: [
          { title: "Write ongoing weekly template" },
          { title: "Celebrate non-scale fitness wins" },
          { title: "Set next horizon goal" },
        ],
      },
    ],
    learning: [
      {
        title: `Week 1 — Map “${short}”`,
        tasks: [
          { title: "Define ‘done’ in one sentence", notes: m || undefined },
          { title: "Break topic into 5 sub-skills" },
          { title: "Gather 1 primary resource (course/book)" },
          { title: "Schedule 4 focus blocks this week" },
          { title: "First 25-minute deep work session" },
          { title: "Write 5 questions you want answered" },
        ],
      },
      {
        title: "Week 2 — Input + tiny output",
        tasks: [
          { title: "Study block 1" },
          { title: "Study block 2" },
          { title: "Teach a concept in 5 bullet notes" },
          { title: "Practice problem or exercise set" },
          { title: "Review mistakes without shame" },
        ],
      },
      {
        title: "Week 3 — Projects over passive reading",
        tasks: [
          { title: "Build a mini project / summary essay" },
          { title: "Spaced repetition review (flashcards/notes)" },
          { title: "Ask or search one stuck question" },
          { title: "Timed practice under light pressure" },
          { title: "Share progress with a friend or journal" },
        ],
      },
      {
        title: "Week 4 — Assessment",
        tasks: [
          { title: "Full practice test or demo" },
          { title: "Patch weakest sub-skill" },
          { title: "Final review pass" },
          { title: "Document what you’ll keep studying" },
        ],
      },
      {
        title: "Close-out",
        tasks: [
          { title: "Archive notes in one place" },
          { title: "Celebrate completion" },
          { title: "Pick next learning goal" },
        ],
      },
    ],
    career: [
      {
        title: `Week 1 — Clarify “${short}”`,
        tasks: [
          { title: "One-sentence outcome + why it matters", notes: m || undefined },
          { title: "List stakeholders / audience" },
          { title: "Inventory skills/assets you already have" },
          { title: "Identify the riskiest assumption" },
          { title: "Block 3 deep-work sessions" },
          { title: "Ship a tiny artifact (outline, draft, mock)" },
        ],
      },
      {
        title: "Week 2 — Build the core",
        tasks: [
          { title: "Draft v1 of main deliverable" },
          { title: "Get one piece of feedback" },
          { title: "Improve based on feedback" },
          { title: "Set up tools/tracking you need" },
          { title: "Mid-week status note to yourself" },
        ],
      },
      {
        title: "Week 3 — Expand & polish",
        tasks: [
          { title: "Add secondary feature / section" },
          { title: "Handle empty/error edge cases" },
          { title: "Polish presentation quality" },
          { title: "Dry-run with a friendly reviewer" },
          { title: "Fix top 3 issues" },
        ],
      },
      {
        title: "Week 4 — Ship",
        tasks: [
          { title: "Finalize deliverable" },
          { title: "Publish / submit / send" },
          { title: "Announce or document outcome" },
          { title: "Write retrospective: keep/stop/start" },
        ],
      },
      {
        title: "Aftercare",
        tasks: [
          { title: "Collect results / metrics" },
          { title: "Thank helpers" },
          { title: "Queue next career leaf" },
        ],
      },
    ],
    creative: [
      {
        title: `Week 1 — Seed “${short}”`,
        tasks: [
          { title: "Collect 10 references / inspiration" },
          { title: "Define tone and audience" },
          { title: "Sketch or outline the whole piece" },
          { title: "Create a messy first draft segment" },
          { title: "Protect one distraction-free hour" },
        ],
      },
      {
        title: "Week 2 — Draft volume",
        tasks: [
          { title: "Daily or near-daily create streak (small)" },
          { title: "Finish first full draft / prototype" },
          { title: "Take a day away, then re-read" },
          { title: "Mark what to cut ruthlessly" },
        ],
      },
      {
        title: "Week 3 — Craft",
        tasks: [
          { title: "Revise structure" },
          { title: "Polish opening and ending" },
          { title: "Get one outside reaction" },
          { title: "Apply best feedback only" },
        ],
      },
      {
        title: "Week 4 — Release",
        tasks: [
          { title: "Final pass" },
          { title: "Publish or share" },
          { title: "Note lessons for next project" },
        ],
      },
      {
        title: "Rest & refill",
        tasks: [
          { title: "Consume art for joy (not research)" },
          { title: "Capture next 3 project seeds" },
        ],
      },
    ],
    finance: [
      {
        title: `Week 1 — Big goal + daily save for “${short}”`,
        tasks: [
          {
            title: "Write the exact dollar target & deadline",
            notes: m || "Clear number beats a vague wish",
          },
          { title: "Calculate daily save amount (remaining ÷ days left)" },
          { title: "Open or name a savings bucket for this goal only" },
          { title: "Set up auto-transfer for the daily or weekly amount" },
          { title: "Complete first transfer today — any amount counts" },
          { title: "Log expenses for 3 days so leaks are visible" },
        ],
      },
      {
        title: "Week 2 — Hit the daily goal most days",
        tasks: [
          { title: "Save today’s dollar target (check it off when done)" },
          { title: "Mid-week catch-up if you missed a day" },
          { title: "Cancel or pause one unused subscription" },
          { title: "One no-spend day · move that money to the goal" },
          { title: "Weekly review: total saved vs weekly target" },
        ],
      },
      {
        title: "Week 3 — Protect the habit",
        tasks: [
          { title: "Keep daily/weekly transfers automatic" },
          { title: "Shop one bill or grocery list with a hard cap" },
          { title: "Define fun-money only after the save is done" },
          { title: "Checkpoint: are you on track to the big goal?" },
        ],
      },
      {
        title: "Week 4 — Momentum to the finish line",
        tasks: [
          { title: "Extra save push (round-ups or side cash)" },
          { title: "Update progress % toward the big goal" },
          { title: "Write rules for windfalls (bonus, gifts, tax return)" },
          { title: "Plan next month’s same daily amount" },
        ],
      },
      {
        title: "Maintain",
        tasks: [
          { title: "Monthly money review: big goal still clear?" },
          { title: "Adjust daily amount if deadline or income changed" },
        ],
      },
    ],
    habit: [
      {
        title: `Week 1 — Tiny daily rep for “${short}”`,
        tasks: [
          {
            title: "Write the 2-minute version (smaller than you think)",
            notes: "Compound starts with embarrassingly small",
          },
          { title: "Assign priority: P1 must / P2 should / P3 boost" },
          { title: "Pick cue (after coffee, after wake, before bed)" },
          { title: "Do the tiny version 4 days this week" },
          { title: "Check it off in Habits (same order every day)" },
          { title: "Protect sleep window — set bed & wake schedule" },
        ],
      },
      {
        title: "Week 2 — P1 streak compounds",
        tasks: [
          { title: "Clear all P1 musts before lower priorities" },
          { title: "Show up 5 days (miss → restart next day, no shame)" },
          { title: "Stack habit after an existing routine" },
          { title: "Log sleep hours 3 nights" },
          { title: "Weekly review: which P1s actually stuck?" },
        ],
      },
      {
        title: "Week 3 — Scale only after consistent",
        tasks: [
          { title: "Increase duration 10–20% only if streak is solid" },
          { title: "Add travel/busy-day mini version" },
          { title: "Never skip sleep tracking on hard weeks" },
          { title: "Accountability: tell one person your P1 list" },
        ],
      },
      {
        title: "Week 4 — Identity + autopilot",
        tasks: [
          { title: "Write ‘I am someone who…’ statement" },
          { title: "Review compound count (lifetime reps)" },
          { title: "Lock sleep schedule for next month" },
          { title: "Only add a new P3 if P1s feel easy" },
        ],
      },
      {
        title: "Lock in",
        tasks: [
          { title: "Celebrate the streak, not perfection" },
          { title: "Keep P1 list short — protect the compound" },
        ],
      },
    ],
    longevity: [
      {
        title: `Week 1 — Longevity baseline for “${short}”`,
        tasks: [
          {
            title: "Write your healthspan definition (1 sentence)",
            notes: m || "Mobility, energy, independence — not just years",
          },
          { title: "Set sleep schedule (bed + wake) and log 3 nights" },
          { title: "Add P1 habit: morning light or outdoor walk 10 min" },
          {
            title: "Longevity plate: protein + plants + olive oil at lunch",
            notes: "See goal meal card · Mediterranean-style",
          },
          { title: "Protein at every meal today (write rough g target)" },
          { title: "Book or schedule annual labs / checkup if overdue" },
          { title: "Zone-2 or easy cardio 20–30 min once this week" },
        ],
      },
      {
        title: "Week 2 — Pillars: sleep · strength · meals",
        tasks: [
          { title: "Strength session full-body (or bodyweight) 1–2×" },
          { title: "Oily fish meal 2× this week (salmon/sardines)" },
          { title: "Hit daily step or walk goal most days" },
          { title: "Sleep: protect wind-down 4 nights" },
          { title: "Berries + leafy greens on 4 days" },
          { title: "Generate longevity meal week in Food → Meal plan" },
        ],
      },
      {
        title: "Week 3 — Metabolic & recovery",
        tasks: [
          { title: "One longer zone-2 session (30–45 min)" },
          { title: "Legume meal 2× (lentils, beans, chickpeas)" },
          { title: "Strength progression (add reps or load gently)" },
          { title: "Stress downshift: 10 min breath/walk after work 3×" },
          { title: "Late meal cutoff earlier 3 nights" },
          { title: "Social connection block (longevity pillar)" },
        ],
      },
      {
        title: "Week 4 — Make it automatic",
        tasks: [
          {
            title: "Weekly longevity scorecard (sleep, train, protein, plants)",
          },
          { title: "Grocery restock: fish, olive oil, greens, berries, yogurt" },
          { title: "Lock recurring blocks for strength + zone 2" },
          { title: "Prune one ultra-processed snack habit" },
          { title: "Plan next quarter lab or fitness retest" },
        ],
      },
      {
        title: "Sustain healthspan",
        tasks: [
          { title: "Monthly review: mobility, sleep, stress, meals" },
          { title: "Keep strength + sleep + protein non-negotiable" },
          {
            title: "Educational only — not medical advice; consult a clinician",
            notes: "Especially before supplements or extreme protocols",
          },
        ],
      },
    ],
    mindset: [
      {
        title: `Week 1 — Mindset foundation for “${short}”`,
        tasks: [
          {
            title: "Define the belief or skill you want (1 sentence)",
            notes: m || "e.g. ‘I recover quickly from setbacks’",
          },
          { title: "Pick a 2–10 min daily practice (breath, sit, walk)" },
          { title: "Add as P1 habit with a clear cue (after wake/coffee)" },
          { title: "Journal one line: what went well today (4 days)" },
          { title: "Notice one unhelpful self-talk loop — write it down" },
          { title: "Protect sleep — mindset collapses when exhausted" },
        ],
      },
      {
        title: "Week 2 — Reps under real life",
        tasks: [
          { title: "Daily practice 5 days (miss → restart, no shame)" },
          { title: "Reframe one frustration using: ‘what can I control?’" },
          { title: "Gratitude or wins list 3 nights" },
          { title: "5-minute body scan or breath when stressed once" },
          { title: "Mid-week check: practice still tiny enough?" },
        ],
      },
      {
        title: "Week 3 — Skills under pressure",
        tasks: [
          { title: "Run the practice before a hard meeting/task once" },
          { title: "Write a replacement thought for old self-talk" },
          { title: "Share one vulnerable win with a trusted person" },
          { title: "Digital boundary: phone-free block 30 min 3×" },
        ],
      },
      {
        title: "Week 4 — Identity install",
        tasks: [
          { title: "Write ‘I am someone who…’ mindset statement" },
          { title: "Review 4-week practice streak / notes" },
          { title: "Choose ongoing P1 (keep or shrink)" },
          { title: "Plan monthly mindset review on calendar" },
        ],
      },
      {
        title: "Continue",
        tasks: [
          { title: "Keep the tiny practice non-negotiable" },
          { title: "Not a substitute for therapy or clinical care if needed" },
        ],
      },
    ],
    relationship: [
      {
        title: `Week 1 — Intention for “${short}”`,
        tasks: [
          { title: "Write what good looks like" },
          { title: "Schedule first dedicated time" },
          { title: "Put phones away for one conversation" },
          { title: "Do one small kindness without being asked" },
        ],
      },
      {
        title: "Week 2 — Consistent presence",
        tasks: [
          { title: "Weekly connection ritual" },
          { title: "Listen fully once (summarize back)" },
          { title: "Plan a shared activity" },
          { title: "Express appreciation specifically" },
        ],
      },
      {
        title: "Week 3 — Repair & deepen",
        tasks: [
          { title: "Address one small friction calmly" },
          { title: "Shared goal or memory creation" },
          { title: "Check in: energy & needs" },
        ],
      },
      {
        title: "Week 4 — Sustain",
        tasks: [
          { title: "Put recurring time on calendar" },
          { title: "Retrospective: what felt connecting?" },
        ],
      },
      {
        title: "Continue",
        tasks: [
          { title: "Keep one weekly non-negotiable touchpoint" },
        ],
      },
    ],
    home: [
      {
        title: `Week 1 — Reset “${short}”`,
        tasks: [
          { title: "Photo before (motivation, not shame)" },
          { title: "Declutter one zone 20 minutes" },
          { title: "Trash / donate bag out the door" },
          { title: "Reset surfaces in main room" },
        ],
      },
      {
        title: "Week 2 — Systems",
        tasks: [
          { title: "Assign homes for top clutter items" },
          { title: "10-minute nightly reset" },
          { title: "Deep-clean one area" },
          { title: "Maintenance checklist on fridge/phone" },
        ],
      },
      {
        title: "Week 3 — Upgrade",
        tasks: [
          { title: "Fix or replace one broken annoyance" },
          { title: "Organize a storage zone" },
          { title: "Involve household in 15-min blitz" },
        ],
      },
      {
        title: "Week 4 — Maintain",
        tasks: [
          { title: "Photo after" },
          { title: "Weekly home reset on calendar" },
        ],
      },
      {
        title: "Ongoing",
        tasks: [{ title: "One-in one-out rule trial" }],
      },
    ],
    general: [
      {
        title: `Week 1 — Clarify “${short}”`,
        tasks: [
          { title: "Write success definition in one paragraph", notes: m || undefined },
          { title: "List constraints and non-goals" },
          { title: "Break work into weekly themes" },
          { title: "Identify first risky assumption" },
          { title: "Block focus time on calendar" },
          { title: "Complete first concrete action today" },
        ],
      },
      {
        title: "Week 2 — Build the foundation",
        tasks: [
          { title: "Set up tools / workspace" },
          { title: "Create starter structure" },
          { title: "Ship a tiny vertical slice" },
          { title: "Document decisions" },
          { title: "Review progress mid-week" },
          { title: "Adjust plan if needed" },
        ],
      },
      {
        title: "Week 3 — Expand",
        tasks: [
          { title: "Implement next priority piece" },
          { title: "Add error / edge handling" },
          { title: "Write a short checklist" },
          { title: "Self walkthrough" },
          { title: "Fix friction points" },
        ],
      },
      {
        title: "Week 4 — Polish & validate",
        tasks: [
          { title: "Improve the main experience" },
          { title: "Get feedback from one person" },
          { title: "Address top feedback" },
          { title: "Measure against success metrics" },
          { title: "Dry-run the finish line" },
        ],
      },
      {
        title: "Week 5 — Ship & reflect",
        tasks: [
          { title: "Finalize deliverable" },
          { title: "Publish or share outcome" },
          { title: "Capture lessons learned" },
          { title: "Celebrate a small win" },
          { title: "Outline next horizon" },
        ],
      },
    ],
  };

  return map[domain];
}

function busyDates(slots: BusySlot[] = []): Set<string> {
  const set = new Set<string>();
  for (const s of slots) {
    try {
      set.add(format(parseISO(s.start), "yyyy-MM-dd"));
    } catch {
      /* ignore */
    }
  }
  return set;
}

function pickDate(
  start: Date,
  end: Date,
  preferredOffset: number,
  busy: Set<string>,
  used: Set<string>
): string {
  let cursor = addDays(start, preferredOffset);
  if (cursor > end) cursor = end;
  for (let i = 0; i < 90; i++) {
    const iso = format(cursor, "yyyy-MM-dd");
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (!busy.has(iso) && !used.has(iso) && !weekend) {
      used.add(iso);
      return iso;
    }
    cursor = addDays(cursor, 1);
    if (cursor > end) cursor = start;
  }
  const fallback = format(
    addDays(
      start,
      preferredOffset % Math.max(1, differenceInCalendarDays(end, start))
    ),
    "yyyy-MM-dd"
  );
  used.add(fallback);
  return fallback;
}

export function buildDomainMockPlan(input: {
  title: string;
  description?: string;
  deadline: string;
  success_metrics?: string;
  busySlots?: BusySlot[];
  category?: string;
}): GeneratedPlan {
  const domain = detectGoalDomain(
    input.title,
    input.description,
    input.category
  );
  // weight_loss without health profile still gets weight templates
  const weeks = templatesFor(domain, input.title, input.success_metrics);
  const start = new Date();
  const end = parseISO(input.deadline);
  const totalDays = Math.max(14, differenceInCalendarDays(end, start));
  const milestoneCount = Math.min(
    weeks.length,
    Math.min(5, Math.max(3, Math.round(totalDays / 14)))
  );
  const busy = busyDates(input.busySlots);
  const used = new Set<string>();

  const milestones = Array.from({ length: milestoneCount }, (_, mi) => {
    const tpl = weeks[mi % weeks.length];
    const weekSpan = Math.floor(totalDays / milestoneCount);
    const targetOffset = Math.min(totalDays - 1, (mi + 1) * weekSpan - 1);
    const target_date = format(addDays(start, targetOffset), "yyyy-MM-dd");
    const taskCount = Math.min(7, Math.max(3, tpl.tasks.length));
    const tasks = tpl.tasks.slice(0, taskCount).map((t, ti) => {
      const preferred = mi * weekSpan + ti;
      return {
        title: t.title,
        scheduled_date: pickDate(start, end, preferred, busy, used),
        notes: t.notes,
      };
    });
    return {
      title: tpl.title,
      target_date,
      tasks,
    };
  });

  return { milestones };
}
