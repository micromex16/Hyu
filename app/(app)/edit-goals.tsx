import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { color, font } from '../../theme';
import { Screen, Button, Eyebrow } from '../../components/ui';
import { kcalFromMacros } from '../../lib/nutrition';
import type { Goal } from '../../lib/types';

export default function EditGoals() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);

  const [calorie, setCalorie] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [proteinPerLb, setProteinPerLb] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase
      .from('goals')
      .select('*')
      .eq('user_id', user!.id)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const g = data as Goal | null;
        if (g) {
          setGoalId(g.id);
          setCalorie(g.calorie_target?.toString() ?? '');
          setProtein(g.protein_target_g?.toString() ?? '');
          setCarb(g.carb_target_g?.toString() ?? '');
          setFat(g.fat_target_g?.toString() ?? '');
          setProteinPerLb(g.protein_g_per_lb?.toString() ?? '');
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function save() {
    setSaving(true);
    const p = protein ? Math.round(parseFloat(protein)) : null;
    const c = carb ? Math.round(parseFloat(carb)) : null;
    const f = fat ? Math.round(parseFloat(fat)) : null;
    const kcal = calorie
      ? Math.round(parseFloat(calorie))
      : p != null && c != null && f != null
        ? kcalFromMacros({ protein_g: p, carb_g: c, fat_g: f })
        : null;

    const payload = {
      user_id: user!.id,
      calorie_target: kcal,
      protein_target_g: p,
      carb_target_g: c,
      fat_target_g: f,
      protein_g_per_lb: proteinPerLb ? parseFloat(proteinPerLb) : null,
    };

    const res = goalId
      ? await supabase.from('goals').update(payload).eq('id', goalId)
      : await supabase.from('goals').insert(payload);

    setSaving(false);
    if (!res.error) router.back();
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text style={{ fontFamily: font.uiLight, fontSize: 24, color: color.ink, letterSpacing: -0.5 }}>
          Edit goals
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-2 active:opacity-60">
          <Ionicons name="close" size={26} color={color.graphite} />
        </Pressable>
      </View>

      {loading ? (
        <View className="px-5 pt-8">
          <ActivityIndicator color={color.sage} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.graphite }}>
            Leave calories blank to auto-calculate from your macros (4/4/9).
          </Text>

          <Field label="Calorie target" value={calorie} onChangeText={setCalorie} placeholder="2200" />
          <View className="flex-row gap-3">
            <Field label="Protein (g)" value={protein} onChangeText={setProtein} containerClassName="flex-1" />
            <Field label="Carbs (g)" value={carb} onChangeText={setCarb} containerClassName="flex-1" />
            <Field label="Fat (g)" value={fat} onChangeText={setFat} containerClassName="flex-1" />
          </View>

          <View style={{ height: 1, backgroundColor: color.hair, marginVertical: 18 }} />
          <Eyebrow>Protein per bodyweight (optional)</Eyebrow>
          <Text style={{ fontFamily: font.ui, fontSize: 12, color: color.graphite, marginTop: 4 }}>
            If set, your protein target is derived from your latest bodyweight (e.g. 0.9 g/lb).
          </Text>
          <Field label="Grams per lb" value={proteinPerLb} onChangeText={setProteinPerLb} placeholder="0.9" />

          <Button label="Save" chamfer disabled={saving} onPress={save} style={{ marginTop: 24 }} />
        </ScrollView>
      )}
    </Screen>
  );
}

function Field({
  label,
  containerClassName = '',
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; containerClassName?: string }) {
  return (
    <View className={`mt-4 ${containerClassName}`}>
      <Eyebrow tone="graphite">{label}</Eyebrow>
      <TextInput
        keyboardType="decimal-pad"
        placeholderTextColor={color.graphite}
        style={{
          marginTop: 6,
          backgroundColor: color.porcelain,
          borderWidth: 1,
          borderColor: color.hair,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontFamily: font.monoMed,
          fontSize: 16,
          color: color.ink,
        }}
        {...props}
      />
    </View>
  );
}
