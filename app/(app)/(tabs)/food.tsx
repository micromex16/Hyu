import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDayNutrition } from '../../../lib/useDayNutrition';
import { MEALS, mealLabel, deleteFoodLog } from '../../../lib/nutrition';
import { addDays, humanDay, todayISO } from '../../../lib/date';
import { color, font } from '../../../theme';
import { Card, MacroBars, MealCard, EmptyMealRow, FoodItem, StatText, Eyebrow } from '../../../components/ui';
import type { FoodLog, Meal } from '../../../lib/types';

export default function FoodLogScreen() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const { logs, totals, targets, refresh } = useDayNutrition(date);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const kcalLeft = targets.kcal - totals.kcal;
  const isFuture = date >= todayISO();

  async function remove(log: FoodLog) {
    await deleteFoodLog(log.id);
    refresh();
  }

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      {/* Date nav */}
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8} className="p-2 active:opacity-60">
          <Ionicons name="chevron-back" size={22} color={color.sageDeep} />
        </Pressable>
        <Text style={{ fontFamily: font.uiMed, fontSize: 15, color: color.ink }}>{humanDay(date)}</Text>
        <Pressable
          onPress={() => setDate(addDays(date, 1))}
          disabled={isFuture}
          hitSlop={8}
          className="p-2 active:opacity-60"
          style={{ opacity: isFuture ? 0.25 : 1 }}
        >
          <Ionicons name="chevron-forward" size={22} color={color.sageDeep} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}>
        {/* The number that matters mid-day */}
        <Card>
          <Eyebrow>Remaining</Eyebrow>
          <View className="mt-1 flex-row items-baseline">
            <StatText style={{ fontSize: 56, color: kcalLeft < 0 ? color.bronze : color.ink, lineHeight: 60 }}>
              {Math.abs(Math.round(kcalLeft)).toLocaleString()}
            </StatText>
            <Text style={{ fontFamily: font.ui, fontSize: 15, color: color.graphite, marginLeft: 8 }}>
              kcal {kcalLeft < 0 ? 'over' : 'left'}
            </Text>
          </View>
          <Text style={{ fontFamily: font.mono, fontSize: 11, color: color.graphite, letterSpacing: 0.5, marginTop: 4 }}>
            {Math.round(totals.kcal).toLocaleString()} eaten · {targets.kcal.toLocaleString()} goal
          </Text>
          <View className="mt-5">
            <MacroBars totals={totals} targets={targets} />
          </View>
        </Card>

        {/* Meals */}
        <View className="mt-4 gap-4">
          {MEALS.map((meal) => {
            const items = logs.filter((l) => l.meal === meal);
            const mealKcal = items.reduce((s, l) => s + l.kcal, 0);
            return (
              <MealCard
                key={meal}
                title={mealLabel(meal)}
                kcal={mealKcal}
                onAdd={() => router.push(`/log-food?meal=${meal}&date=${date}`)}
              >
                {items.length === 0 ? (
                  <EmptyMealRow
                    label={`Log ${mealLabel(meal).toLowerCase()}`}
                    onPress={() => router.push(`/log-food?meal=${meal}&date=${date}`)}
                  />
                ) : (
                  items.map((l, idx) => (
                    <FoodItem
                      key={l.id}
                      name={l.name_snapshot ?? 'Food'}
                      detail={l.food_id ? `${l.quantity} ${l.unit}` : 'Quick add'}
                      kcal={l.kcal}
                      protein={l.protein_g}
                      hairline={idx > 0}
                      onLongPress={() =>
                        Alert.alert('Remove entry?', l.name_snapshot ?? 'Entry', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => remove(l) },
                        ])
                      }
                    />
                  ))
                )}
              </MealCard>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
