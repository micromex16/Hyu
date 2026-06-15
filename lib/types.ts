// Hand-authored domain types mirroring the SQL schema (supabase/migrations/0001_init.sql).
// The Supabase client is loosely typed for now; regenerate lib/database.types.ts with
// `npx supabase gen types typescript --linked` once your project is linked for full inference.

export type WeightUnit = 'lb' | 'kg';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snacks';
export type FoodSource = 'usda' | 'off' | 'custom';
export type BodyMetricSource = 'manual' | 'healthkit';
export type Comparator = 'gte' | 'lte' | 'bool';
export type ChallengeStatus = 'draft' | 'active' | 'completed';
export type ParticipantStatus = 'invited' | 'joined' | 'declined';
export type FriendshipStatus = 'pending' | 'accepted';
export type RecordType = 'max_weight' | 'best_e1rm' | 'max_volume' | 'max_reps';

export interface Profile {
  user_id: string;
  handle: string | null;
  display_name: string;
  weight_unit: WeightUnit;
  height_cm: number | null;
  sex: 'male' | 'female' | 'other' | null;
  birthdate: string | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  calorie_target: number | null;
  protein_g_per_lb: number | null;
  protein_target_g: number | null;
  carb_target_g: number | null;
  fat_target_g: number | null;
  effective_from: string;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  bodyfat_pct: number | null;
  source: BodyMetricSource;
  notes: string | null;
  created_at: string;
}

export interface Food {
  id: string;
  source: FoodSource;
  source_ref: string | null;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carb_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_mg_per_100g: number | null;
  owner_user_id: string | null;
  created_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  date: string;
  meal: Meal;
  food_id: string | null;
  quantity: number;
  unit: string;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  name_snapshot: string | null;
  created_at: string;
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  meal: Meal | null;
  created_at: string;
}

export interface MealTemplateItem {
  id: string;
  meal_template_id: string;
  food_id: string | null;
  quantity: number;
  unit: string;
  name_snapshot: string | null;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
  sort_order: number;
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string | null;
  secondary_muscles: string[];
  equipment: string | null;
  owner_user_id: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  name: string | null;
  notes: string | null;
  duration_min: number | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order: number;
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  rpe: number | null;
  is_warmup: boolean;
  e1rm: number;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  record_type: RecordType;
  value: number;
  reps: number | null;
  achieved_at: string;
  workout_set_id: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  order: number;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  requested_by: string;
  created_at: string;
}

export interface ScoringRules {
  points_per_goal: number;
  perfect_day_bonus: number;
}

export interface Challenge {
  id: string;
  creator_id: string;
  name: string;
  start_date: string;
  duration_days: number;
  end_date: string;
  status: ChallengeStatus;
  goal_types: string[];
  scoring_rules: ScoringRules;
  allow_late_join: boolean;
  created_at: string;
}

export interface ChallengeParticipant {
  challenge_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string | null;
  created_at: string;
}

export interface ChallengeGoal {
  id: string;
  challenge_id: string;
  user_id: string;
  goal_type: string;
  target_value: number | null;
  comparator: Comparator;
  locked_at: string | null;
  created_at: string;
}

export interface ChallengeDailyScore {
  id: string;
  challenge_id: string;
  user_id: string;
  date: string;
  points_earned: number;
  goals_hit: Record<string, boolean>;
  perfect_day: boolean;
  updated_at: string;
}

// Normalized food returned by the fdc-search edge function (per-100g shape).
export interface NormalizedFood {
  source: 'usda';
  source_ref: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carb_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_mg_per_100g: number | null;
}
