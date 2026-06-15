import { supabase } from './supabase';
import type { Food, FoodLog, Goal, Meal, NormalizedFood } from './types';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export function mealLabel(meal: Meal): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

export type Unit = 'g' | 'oz' | 'serving';
export const UNITS: Unit[] = ['serving', 'g', 'oz'];

const OZ_TO_G = 28.3495;

// Convert a (quantity, unit) against a food into grams of that food.
export function toGrams(food: Pick<Food, 'serving_size'>, quantity: number, unit: Unit): number {
  switch (unit) {
    case 'g':
      return quantity;
    case 'oz':
      return quantity * OZ_TO_G;
    case 'serving':
    default:
      return quantity * (food.serving_size || 100);
  }
}

export interface Macros {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// Scale a per-100g food to the macros actually consumed.
export function macrosForLog(food: Food, quantity: number, unit: Unit): Macros {
  const grams = toGrams(food, quantity, unit);
  const f = grams / 100;
  return {
    kcal: Math.round(food.kcal_per_100g * f),
    protein_g: round1(food.protein_per_100g * f),
    carb_g: round1(food.carb_per_100g * f),
    fat_g: round1(food.fat_per_100g * f),
  };
}

export function sumMacros(logs: Pick<FoodLog, 'kcal' | 'protein_g' | 'carb_g' | 'fat_g'>[]): Macros {
  return logs.reduce<Macros>(
    (acc, l) => ({
      kcal: acc.kcal + l.kcal,
      protein_g: round1(acc.protein_g + l.protein_g),
      carb_g: round1(acc.carb_g + l.carb_g),
      fat_g: round1(acc.fat_g + l.fat_g),
    }),
    { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 },
  );
}

// 4/4/9 kcal per gram — used to sanity-derive a calorie target from macros if missing.
export function kcalFromMacros(m: { protein_g: number; carb_g: number; fat_g: number }): number {
  return Math.round(m.protein_g * 4 + m.carb_g * 4 + m.fat_g * 9);
}

// ─── FDC proxy (Edge Function) ───────────────────────────────────────────────

export async function searchFdc(query: string, pageSize = 25): Promise<NormalizedFood[]> {
  const { data, error } = await supabase.functions.invoke('fdc-search', {
    body: { action: 'search', query, pageSize },
  });
  if (error) throw new Error(error.message);
  return (data?.foods ?? []) as NormalizedFood[];
}

// ─── Foods: import-on-log caching ────────────────────────────────────────────

// Cache an external food (USDA/OFF) into our `foods` table so we never refetch
// and the app works offline. Returns the persisted food row. Idempotent on
// (source, source_ref).
export async function cacheExternalFood(n: NormalizedFood): Promise<Food> {
  const existing = await supabase
    .from('foods')
    .select('*')
    .eq('source', n.source)
    .eq('source_ref', n.source_ref)
    .is('owner_user_id', null)
    .maybeSingle();

  if (existing.data) return existing.data as Food;

  const { data, error } = await supabase
    .from('foods')
    .insert({
      source: n.source,
      source_ref: n.source_ref,
      name: n.name,
      brand: n.brand,
      serving_size: n.serving_size,
      serving_unit: n.serving_unit,
      kcal_per_100g: n.kcal_per_100g,
      protein_per_100g: n.protein_per_100g,
      carb_per_100g: n.carb_per_100g,
      fat_per_100g: n.fat_per_100g,
      fiber_per_100g: n.fiber_per_100g,
      sugar_per_100g: n.sugar_per_100g,
      sodium_mg_per_100g: n.sodium_mg_per_100g,
      owner_user_id: null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Food;
}

// Create a user-owned custom food from per-serving macros.
export async function createCustomFood(input: {
  userId: string;
  name: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: string;
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}): Promise<Food> {
  // Convert the per-serving macros the user typed into per-100g storage.
  // Serving size is treated as grams for the per-100g math; non-gram servings
  // still scale proportionally by "serving" units when logged.
  const basis = input.servingSize > 0 ? input.servingSize : 100;
  const per100 = (v: number) => round1((v / basis) * 100);

  const { data, error } = await supabase
    .from('foods')
    .insert({
      source: 'custom',
      name: input.name,
      brand: input.brand ?? null,
      serving_size: input.servingSize,
      serving_unit: input.servingUnit,
      kcal_per_100g: Math.round((input.kcal / basis) * 100),
      protein_per_100g: per100(input.protein_g),
      carb_per_100g: per100(input.carb_g),
      fat_per_100g: per100(input.fat_g),
      owner_user_id: input.userId,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Food;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

export async function logFood(input: {
  userId: string;
  date: string;
  meal: Meal;
  food: Food;
  quantity: number;
  unit: Unit;
}): Promise<void> {
  const m = macrosForLog(input.food, input.quantity, input.unit);
  const { error } = await supabase.from('food_logs').insert({
    user_id: input.userId,
    date: input.date,
    meal: input.meal,
    food_id: input.food.id,
    quantity: input.quantity,
    unit: input.unit,
    kcal: m.kcal,
    protein_g: m.protein_g,
    carb_g: m.carb_g,
    fat_g: m.fat_g,
    name_snapshot: input.food.name,
  });
  if (error) throw new Error(error.message);
}

export async function quickAdd(input: {
  userId: string;
  date: string;
  meal: Meal;
  name: string;
  macros: Macros;
}): Promise<void> {
  const { error } = await supabase.from('food_logs').insert({
    user_id: input.userId,
    date: input.date,
    meal: input.meal,
    food_id: null,
    quantity: 1,
    unit: 'serving',
    kcal: input.macros.kcal,
    protein_g: input.macros.protein_g,
    carb_g: input.macros.carb_g,
    fat_g: input.macros.fat_g,
    name_snapshot: input.name || 'Quick add',
  });
  if (error) throw new Error(error.message);
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from('food_logs').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export interface DailyTargets {
  kcal: number;
  protein_g: number;
  carb_g: number;
  fat_g: number;
}

// Resolve the active goal into concrete gram/kcal targets. Protein may be set as
// grams-per-pound, in which case it's derived from the latest bodyweight (lb).
export function resolveTargets(goal: Goal | null, bodyweightLb: number | null): DailyTargets {
  if (!goal) return { kcal: 2200, protein_g: 160, carb_g: 220, fat_g: 70 };

  let protein = goal.protein_target_g ?? 0;
  if (goal.protein_g_per_lb && bodyweightLb) {
    protein = Math.round(goal.protein_g_per_lb * bodyweightLb);
  }
  const carb = goal.carb_target_g ?? 0;
  const fat = goal.fat_target_g ?? 0;
  const kcal = goal.calorie_target ?? kcalFromMacros({ protein_g: protein, carb_g: carb, fat_g: fat });

  return { kcal, protein_g: protein, carb_g: carb, fat_g: fat };
}
