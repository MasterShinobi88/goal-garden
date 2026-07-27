import type { WeightLossPlanSummary, WeightLossProfile } from "./health";
import type { SavingsPlanSummary, SavingsProfile } from "./savings-plan";
import type { EarningPlanSummary, EarningProfile } from "./earning-plan";
import type { PlantType } from "./plants";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  preferences: UserPreferences;
  streak_count: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPreferences = {
  calendar_provider?: "none" | "google" | "outlook" | "mock";
  work_start_hour?: number;
  work_end_hour?: number;
  encouragement_style?: "gentle" | "energetic" | "minimal";
  sunday_review_enabled?: boolean;
  theme?: "dark";
  /** Soft leaf chime on task complete */
  sound_enabled?: boolean;
  /** Less motion / simpler celebrations */
  reduced_motion?: boolean;
  /** ISO date of last weekly grace day used */
  grace_day_used?: string | null;
  /** Gentle OS notifications (opt-in) */
  notifications_enabled?: boolean;
  notifications_daily?: boolean;
  notifications_weekly?: boolean;
  notifications_hour?: number;
  notifications_quiet_start?: number;
  notifications_quiet_end?: number;
};

export type GoalCategory =
  | "general"
  | "weight_loss"
  | "health"
  | "longevity"
  | "mindset"
  | "savings"
  | "income"
  | "fitness"
  | "learning"
  | "career"
  | "habit"
  | "creative"
  | "relationship"
  | "home";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: string;
  success_metrics: string | null;
  archived: boolean;
  category?: GoalCategory;
  /** Stored weight-loss intake + calculated targets */
  health_profile?: WeightLossProfile | null;
  health_plan?: WeightLossPlanSummary | null;
  /** Savings goal intake + calculated daily/weekly targets */
  savings_profile?: SavingsProfile | null;
  savings_plan?: SavingsPlanSummary | null;
  /** Earning / job / income goal intake + action targets */
  earning_profile?: EarningProfile | null;
  earning_plan?: EarningPlanSummary | null;
  /** Species grown on the progress tree */
  plant_type?: PlantType | null;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  goal_id: string;
  title: string;
  target_date: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
};

export type DailyTask = {
  id: string;
  milestone_id: string;
  title: string;
  scheduled_date: string;
  completed: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

export type WeeklyReview = {
  id: string;
  user_id: string;
  week_start: string;
  completed_count: number;
  missed_count: number;
  reflection_notes: string | null;
  suggestions: string | null;
  created_at: string;
};

export type GoalWithTree = Goal & {
  milestones: (Milestone & { daily_tasks: DailyTask[] })[];
};

export type GeneratedPlan = {
  milestones: {
    title: string;
    target_date: string;
    tasks: {
      title: string;
      scheduled_date: string;
      notes?: string;
    }[];
  }[];
  health_summary?: WeightLossPlanSummary;
  savings_summary?: SavingsPlanSummary;
  earning_summary?: EarningPlanSummary;
};

export type BusySlot = {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "google" | "outlook" | "mock" | "task";
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: Record<string, unknown>;
};
