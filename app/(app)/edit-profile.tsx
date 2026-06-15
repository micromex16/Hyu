import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { color, font } from '../../theme';
import { Screen, Button, Eyebrow } from '../../components/ui';
import type { Profile, WeightUnit } from '../../lib/types';

export default function EditProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');

  useEffect(() => {
    let mounted = true;
    supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        const p = data as Profile | null;
        if (p) {
          setDisplayName(p.display_name ?? '');
          setHandle(p.handle ?? '');
          setWeightUnit(p.weight_unit ?? 'lb');
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  async function save() {
    if (!displayName.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        handle: handle.trim() ? handle.trim() : null,
        weight_unit: weightUnit,
      })
      .eq('user_id', user!.id);
    setSaving(false);
    if (error) {
      setError(error.message.includes('duplicate') ? 'That handle is already taken.' : error.message);
      return;
    }
    router.back();
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text style={{ fontFamily: font.uiLight, fontSize: 24, color: color.ink, letterSpacing: -0.5 }}>
          Edit profile
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
          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <Field
            label="Handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="e.g. gio (used for friend search)"
            autoCapitalize="none"
          />

          <Text style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: color.graphite, marginTop: 16, marginBottom: 8 }}>
            Weight unit
          </Text>
          <View className="flex-row gap-2">
            {(['lb', 'kg'] as WeightUnit[]).map((u) => {
              const on = weightUnit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setWeightUnit(u)}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                    backgroundColor: on ? color.sage : color.porcelain,
                    borderWidth: 1,
                    borderColor: on ? color.sage : color.hair,
                  }}
                >
                  <Text style={{ fontFamily: font.uiMed, fontSize: 14, color: on ? color.porcelain : color.graphite }}>
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error && <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.bronze, marginTop: 14 }}>{error}</Text>}

          <Button label="Save" chamfer disabled={saving} onPress={save} style={{ marginTop: 24 }} />
        </ScrollView>
      )}
    </Screen>
  );
}

function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View className="mt-4">
      <Eyebrow tone="graphite">{label}</Eyebrow>
      <TextInput
        placeholderTextColor={color.graphite}
        style={{
          marginTop: 6,
          backgroundColor: color.porcelain,
          borderWidth: 1,
          borderColor: color.hair,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          fontFamily: font.ui,
          fontSize: 16,
          color: color.ink,
        }}
        {...props}
      />
    </View>
  );
}
