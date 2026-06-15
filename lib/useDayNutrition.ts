import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { resolveTargets, sumMacros, type DailyTargets, type Macros } from './nutrition';
import type { FoodLog, Goal } from './types';

interface DayNutrition {
  logs: FoodLog[];
  totals: Macros;
  targets: DailyTargets;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Loads a day's food logs + the active goal + latest bodyweight, and derives
// totals and concrete targets. Shared by the dashboard and the food log screen.
export function useDayNutrition(date: string): DayNutrition {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [bodyweightLb, setBodyweightLb] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;

    const [logsRes, goalRes, weightRes, profileRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('body_metrics')
        .select('weight')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('profiles').select('weight_unit').eq('user_id', user.id).maybeSingle(),
    ]);

    setLogs((logsRes.data ?? []) as FoodLog[]);
    setGoal((goalRes.data ?? null) as Goal | null);

    const w = weightRes.data?.weight as number | undefined;
    const unit = (profileRes.data?.weight_unit as 'lb' | 'kg' | undefined) ?? 'lb';
    setBodyweightLb(w == null ? null : unit === 'kg' ? w * 2.2046226218 : w);

    setLoading(false);
  }, [user, date]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return {
    logs,
    totals: sumMacros(logs),
    targets: resolveTargets(goal, bodyweightLb),
    loading,
    refresh,
  };
}
