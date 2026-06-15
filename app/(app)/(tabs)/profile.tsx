import { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { color, font } from '../../../theme';
import { Card, Button, Eyebrow } from '../../../components/ui';
import type { Profile } from '../../../lib/types';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
        .then(({ data }) => {
          if (mounted) {
            setProfile(data as Profile | null);
            setLoading(false);
          }
        });
      return () => {
        mounted = false;
      };
    }, [user]),
  );

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}>
        <Eyebrow>Account</Eyebrow>
        <Text style={{ fontFamily: font.uiLight, fontSize: 27, color: color.ink, letterSpacing: -0.6, marginTop: 2 }}>
          {profile?.display_name ?? 'You'}
        </Text>

        <Card style={{ marginTop: 18, paddingVertical: 6 }}>
          {loading ? (
            <View className="py-6">
              <ActivityIndicator color={color.sage} />
            </View>
          ) : (
            <View>
              <Row label="Handle" value={profile?.handle ?? 'not set'} />
              <Row label="Email" value={user?.email ?? '—'} hairline />
              <Row label="Weight unit" value={profile?.weight_unit ?? 'lb'} hairline />
            </View>
          )}
        </Card>

        <Button label="Sign out" variant="ink" onPress={signOut} style={{ marginTop: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, hairline }: { label: string; value: string; hairline?: boolean }) {
  return (
    <View
      className="flex-row items-center justify-between py-3.5"
      style={hairline ? { borderTopWidth: 1, borderTopColor: color.hair } : undefined}
    >
      <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.graphite }}>{label}</Text>
      <Text style={{ fontFamily: font.uiMed, fontSize: 14, color: color.ink }}>{value}</Text>
    </View>
  );
}
