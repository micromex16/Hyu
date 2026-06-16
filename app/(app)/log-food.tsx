import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import {
  MEALS,
  UNITS,
  mealLabel,
  macrosForLog,
  searchFdc,
  cacheExternalFood,
  logFood,
  quickAdd,
  createCustomFood,
  type Unit,
} from '../../lib/nutrition';
import { todayISO } from '../../lib/date';
import { color, font } from '../../theme';
import { Button, Eyebrow, StatText } from '../../components/ui';
import type { Food, Meal, NormalizedFood } from '../../lib/types';

type Mode = 'search' | 'custom' | 'quick';

function defaultMeal(): Meal {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snacks';
}

export default function LogFood() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ meal?: Meal; date?: string }>();

  const date = params.date ?? todayISO();
  const [meal, setMeal] = useState<Meal>(params.meal ?? defaultMeal());
  const [mode, setMode] = useState<Mode>('search');
  const [saving, setSaving] = useState(false);

  async function done() {
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.bone }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3">
          <Text style={{ fontFamily: font.uiLight, fontSize: 24, color: color.ink, letterSpacing: -0.5 }}>
            Log food
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8} className="p-2 active:opacity-60">
            <Ionicons name="close" size={26} color={color.graphite} />
          </Pressable>
        </View>

        {/* Meal chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }}>
          {MEALS.map((m) => {
            const on = meal === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMeal(m)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: on ? color.sage : color.porcelain2,
                  borderWidth: 1,
                  borderColor: on ? color.sage : color.hair,
                }}
              >
                <Text style={{ fontFamily: font.uiMed, fontSize: 13, color: on ? color.porcelain : color.graphite }}>
                  {mealLabel(m)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Mode segments */}
        <View style={{ marginHorizontal: 20, flexDirection: 'row', backgroundColor: color.porcelain2, borderRadius: 15, padding: 4 }}>
          {(['search', 'custom', 'quick'] as Mode[]).map((m) => {
            const on = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  borderRadius: 11,
                  paddingVertical: 9,
                  backgroundColor: on ? color.porcelain : 'transparent',
                }}
              >
                <Text style={{ fontFamily: on ? font.uiSemi : font.ui, fontSize: 13, color: on ? color.ink : color.graphite }}>
                  {m === 'search' ? 'Search' : m === 'custom' ? 'Custom' : 'Quick add'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1 px-5 pt-4">
          {mode === 'search' && <SearchMode userId={user!.id} date={date} meal={meal} onLogged={done} />}
          {mode === 'custom' && (
            <CustomMode userId={user!.id} date={date} meal={meal} saving={saving} setSaving={setSaving} onLogged={done} />
          )}
          {mode === 'quick' && (
            <QuickMode userId={user!.id} date={date} meal={meal} saving={saving} setSaving={setSaving} onLogged={done} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Search (USDA FoodData Central) ──────────────────────────────────────────

function SearchMode({ userId, date, meal, onLogged }: { userId: string; date: string; meal: Meal; onLogged: () => void }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NormalizedFood[]>([]);
  const [selected, setSelected] = useState<NormalizedFood | null>(null);

  async function run() {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchFdc(q.trim()));
    } catch (e) {
      setError('Search needs the fdc-search Edge Function deployed (see README). Use Custom or Quick add for now.');
    } finally {
      setLoading(false);
    }
  }

  if (selected) {
    return (
      <PortionPanel
        food={selected}
        onCancel={() => setSelected(null)}
        onConfirm={async (qty, unit) => {
          const cached = await cacheExternalFood(selected);
          await logFood({ userId, date, meal, food: cached, quantity: qty, unit });
          onLogged();
        }}
      />
    );
  }

  return (
    <View className="flex-1">
      <View
        className="flex-row items-center gap-2 px-4"
        style={{ backgroundColor: color.porcelain, borderRadius: 15, borderWidth: 1, borderColor: color.hair }}
      >
        <Ionicons name="search" size={18} color={color.graphite} />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={run}
          returnKeyType="search"
          placeholder="Search foods (e.g. chicken breast)"
          placeholderTextColor={color.graphite}
          style={{ flex: 1, paddingVertical: 13, fontFamily: font.ui, fontSize: 15, color: color.ink }}
        />
      </View>

      {loading && <ActivityIndicator color={color.sage} className="mt-6" />}
      {error && <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.bronze, marginTop: 16 }}>{error}</Text>}

      <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
        {results.map((r) => (
          <Pressable
            key={r.source_ref}
            onPress={() => setSelected(r)}
            className="py-3 active:opacity-60"
            style={{ borderBottomWidth: 1, borderBottomColor: color.hair }}
          >
            <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.ink }} numberOfLines={1}>
              {r.name}
            </Text>
            <View className="mt-0.5 flex-row items-center">
              {r.brand ? (
                <Text style={{ fontFamily: font.ui, fontSize: 12, color: color.graphite }}>{r.brand} · </Text>
              ) : null}
              <StatText style={{ fontSize: 11.5, color: color.graphite }}>
                {Math.round(r.kcal_per_100g)} kcal · P{Math.round(r.protein_per_100g)} C{Math.round(r.carb_per_100g)} F
                {Math.round(r.fat_per_100g)} /100g
              </StatText>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function PortionPanel({
  food,
  onCancel,
  onConfirm,
}: {
  food: NormalizedFood;
  onCancel: () => void;
  onConfirm: (qty: number, unit: Unit) => Promise<void>;
}) {
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<Unit>('serving');
  const [busy, setBusy] = useState(false);

  const preview = useMemo(
    () => macrosForLog(food as unknown as Food, parseFloat(qty) || 0, unit),
    [food, qty, unit],
  );

  return (
    <View className="flex-1">
      <Pressable onPress={onCancel} className="flex-row items-center gap-1 active:opacity-60">
        <Ionicons name="chevron-back" size={20} color={color.sageDeep} />
        <Text style={{ fontFamily: font.uiMed, fontSize: 13, color: color.sageDeep }}>Back to results</Text>
      </Pressable>

      <Text style={{ fontFamily: font.uiMed, fontSize: 17, color: color.ink, marginTop: 12 }}>{food.name}</Text>
      {food.brand ? <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.graphite }}>{food.brand}</Text> : null}

      <View className="mt-5 flex-row items-center gap-3">
        <TextInput
          value={qty}
          onChangeText={setQty}
          keyboardType="decimal-pad"
          style={{
            width: 84,
            backgroundColor: color.porcelain,
            borderWidth: 1,
            borderColor: color.hair,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: font.monoMed,
            fontSize: 18,
            color: color.ink,
          }}
        />
        <View className="flex-row gap-2">
          {UNITS.map((u) => {
            const on = unit === u;
            return (
              <Pressable
                key={u}
                onPress={() => setUnit(u)}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  backgroundColor: on ? color.sage : color.porcelain2,
                  borderWidth: 1,
                  borderColor: on ? color.sage : color.hair,
                }}
              >
                <Text style={{ fontFamily: font.uiMed, fontSize: 12, color: on ? color.porcelain : color.graphite }}>
                  {u === 'serving' ? `serving (${food.serving_size}${food.serving_unit})` : u}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 20, backgroundColor: color.porcelain2, borderRadius: 18, padding: 16 }}>
        <View className="flex-row items-baseline">
          <StatText style={{ fontSize: 30, color: color.ink }}>{preview.kcal}</StatText>
          <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.graphite, marginLeft: 6 }}>kcal</Text>
        </View>
        <StatText style={{ fontSize: 13, color: color.graphite, marginTop: 4 }}>
          P {preview.protein_g}g · C {preview.carb_g}g · F {preview.fat_g}g
        </StatText>
      </View>

      <Button
        label="Log it"
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await onConfirm(parseFloat(qty) || 0, unit);
          } finally {
            setBusy(false);
          }
        }}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}

// ─── Custom food ─────────────────────────────────────────────────────────────

function CustomMode({
  userId,
  date,
  meal,
  saving,
  setSaving,
  onLogged,
}: {
  userId: string;
  date: string;
  meal: Meal;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onLogged: () => void;
}) {
  const [name, setName] = useState('');
  const [serving, setServing] = useState('100');
  const [servingUnit, setServingUnit] = useState('g');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('Give the food a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const food = await createCustomFood({
        userId,
        name: name.trim(),
        servingSize: parseFloat(serving) || 100,
        servingUnit: servingUnit || 'g',
        kcal: parseFloat(kcal) || 0,
        protein_g: parseFloat(protein) || 0,
        carb_g: parseFloat(carb) || 0,
        fat_g: parseFloat(fat) || 0,
      });
      await logFood({ userId, date, meal, food, quantity: 1, unit: 'serving' });
      onLogged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Eyebrow>Per serving · saved for reuse</Eyebrow>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Chipotle bowl" />
      <View className="flex-row gap-3">
        <Field label="Serving size" value={serving} onChangeText={setServing} keyboardType="decimal-pad" containerClassName="flex-1" mono />
        <Field label="Unit" value={servingUnit} onChangeText={setServingUnit} containerClassName="w-24" />
      </View>
      <Field label="Calories (kcal)" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" mono />
      <View className="flex-row gap-3">
        <Field label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" containerClassName="flex-1" mono />
        <Field label="Carbs (g)" value={carb} onChangeText={setCarb} keyboardType="decimal-pad" containerClassName="flex-1" mono />
        <Field label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" containerClassName="flex-1" mono />
      </View>

      {error && <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.bronze, marginTop: 8 }}>{error}</Text>}

      <Button label="Save & log" disabled={saving} onPress={save} style={{ marginTop: 20, marginBottom: 40 }} />
    </ScrollView>
  );
}

// ─── Quick add ───────────────────────────────────────────────────────────────

function QuickMode({
  userId,
  date,
  meal,
  saving,
  setSaving,
  onLogged,
}: {
  userId: string;
  date: string;
  meal: Meal;
  saving: boolean;
  setSaving: (b: boolean) => void;
  onLogged: () => void;
}) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  async function add() {
    setSaving(true);
    try {
      await quickAdd({
        userId,
        date,
        meal,
        name: name.trim(),
        macros: {
          kcal: Math.round(parseFloat(kcal) || 0),
          protein_g: parseFloat(protein) || 0,
          carb_g: parseFloat(carb) || 0,
          fat_g: parseFloat(fat) || 0,
        },
      });
      onLogged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Eyebrow>Raw numbers · no food record</Eyebrow>
      <Field label="Label (optional)" value={name} onChangeText={setName} placeholder="Quick add" />
      <Field label="Calories (kcal)" value={kcal} onChangeText={setKcal} keyboardType="decimal-pad" mono />
      <View className="flex-row gap-3">
        <Field label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="decimal-pad" containerClassName="flex-1" mono />
        <Field label="Carbs (g)" value={carb} onChangeText={setCarb} keyboardType="decimal-pad" containerClassName="flex-1" mono />
        <Field label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="decimal-pad" containerClassName="flex-1" mono />
      </View>

      <Button label="Add" disabled={saving} onPress={add} style={{ marginTop: 20, marginBottom: 40 }} />
    </ScrollView>
  );
}

function Field({
  label,
  containerClassName = '',
  mono,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; containerClassName?: string; mono?: boolean }) {
  return (
    <View className={`mt-3 ${containerClassName}`}>
      <Text style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: color.graphite, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={color.graphite}
        style={{
          backgroundColor: color.porcelain,
          borderWidth: 1,
          borderColor: color.hair,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: mono ? font.monoMed : font.ui,
          fontSize: 15,
          color: color.ink,
        }}
        {...props}
      />
    </View>
  );
}
