import { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { color, font } from '../../../theme';
import { Screen, Card, Button, Eyebrow, StatText } from '../../../components/ui';
import type { Goal, Profile } from '../../../lib/types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle(),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user!.id)
          .order('effective_from', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]).then(([p, g]) => {
        if (mounted) {
          setProfile(p.data as Profile | null);
          setGoal(g.data as Goal | null);
          setLoading(false);
        }
      });
      return () => {
        mounted = false;
      };
    }, [user]),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}>
        <Eyebrow>Account</Eyebrow>
        <Text style={{ fontFamily: font.uiLight, fontSize: 27, color: color.ink, letterSpacing: -0.6, marginTop: 2 }}>
          {profile?.display_name ?? 'You'}
        </Text>

        {loading ? (
          <View className="py-10">
            <ActivityIndicator color={color.sage} />
          </View>
        ) : (
          <>
            {/* Profile */}
            <Card style={{ marginTop: 18, paddingVertical: 6 }}>
              <Row label="Name" value={profile?.display_name ?? '—'} />
              <Row label="Handle" value={profile?.handle ?? 'not set'} hairline />
              <Row label="Email" value={user?.email ?? '—'} hairline />
              <Row label="Weight unit" value={profile?.weight_unit ?? 'lb'} hairline />
            </Card>
            <Button label="Edit profile" variant="ink" onPress={() => router.push('/edit-profile')} style={{ marginTop: 12 }} />

            {/* Goals */}
            <Eyebrow>Daily targets</Eyebrow>
            <View style={{ height: 8 }} />
            <Card style={{ paddingVertical: 6 }}>
              <Row label="Calories" value={goal?.calorie_target != null ? `${goal.calorie_target}` : '—'} mono />
              <Row label="Protein" value={goal?.protein_target_g != null ? `${goal.protein_target_g} g` : '—'} mono hairline />
              <Row label="Carbs" value={goal?.carb_target_g != null ? `${goal.carb_target_g} g` : '—'} mono hairline />
              <Row label="Fat" value={goal?.fat_target_g != null ? `${goal.fat_target_g} g` : '—'} mono hairline />
              {goal?.protein_g_per_lb != null ? (
                <Row label="Protein / lb" value={`${goal.protein_g_per_lb}`} mono hairline />
              ) : null}
            </Card>
            <Button label="Edit goals" variant="ink" onPress={() => router.push('/edit-goals')} style={{ marginTop: 12 }} />

            <Button label="Sign out" variant="primary" onPress={signOut} style={{ marginTop: 24 }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, hairline, mono }: { label: string; value: string; hairline?: boolean; mono?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between py-3.5"
      style={hairline ? { borderTopWidth: 1, borderTopColor: color.hair } : undefined}
    >
      <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.graphite }}>{label}</Text>
      {mono ? (
        <StatText style={{ fontSize: 14, color: color.ink }}>{value}</StatText>
      ) : (
        <Text style={{ fontFamily: font.uiMed, fontSize: 14, color: color.ink }}>{value}</Text>
      )}
    </View>
  );
}
