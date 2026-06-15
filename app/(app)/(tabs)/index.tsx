import { useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { useDayNutrition } from '../../../lib/useDayNutrition';
import { todayISO } from '../../../lib/date';
import { color, font } from '../../../theme';
import { Screen, Card, CalorieRing, MacroBars, Button, Eyebrow } from '../../../components/ui';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { totals, targets, refresh } = useDayNutrition(todayISO());

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const name = user?.email?.split('@')[0] ?? 'athlete';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}>
        {/* Human greeting first */}
        <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.graphite }}>{greeting()}</Text>
        <Text style={{ fontFamily: font.uiLight, fontSize: 27, color: color.ink, letterSpacing: -0.6, textTransform: 'capitalize' }}>
          {name}
        </Text>

        {/* Calories + macros */}
        <Card style={{ marginTop: 20 }}>
          <Eyebrow>Today · Calories</Eyebrow>
          <View className="my-4 items-center">
            <CalorieRing consumed={totals.kcal} target={targets.kcal} />
          </View>
          <MacroBars totals={totals} targets={targets} />
        </Card>

        {/* Primary action — the one chamfer on this screen */}
        <Button label="Log food" chamfer onPress={() => router.push('/log-food')} style={{ marginTop: 16 }} />

        {/* Training (built in step 7) */}
        <Card style={{ marginTop: 16 }}>
          <Eyebrow>Today · Training</Eyebrow>
          <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.graphite, marginTop: 8 }}>
            Your workout logger lands here in step 7.
          </Text>
          <Button label="Start workout" variant="ink" disabled style={{ marginTop: 14 }} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
