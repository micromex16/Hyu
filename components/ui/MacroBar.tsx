import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, font, gradient } from '../../theme';
import { StatText } from './StatText';
import type { DailyTargets, Macros } from '../../lib/nutrition';

function Bar({
  label,
  consumed,
  target,
  protein,
}: {
  label: string;
  consumed: number;
  target: number;
  protein?: boolean;
}) {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  return (
    <View className="flex-1">
      <Text
        style={{
          fontFamily: font.mono,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: protein ? color.sageDeep : color.graphite,
        }}
      >
        {label}
      </Text>
      <View className="mb-2 mt-1 flex-row items-baseline">
        <StatText style={{ fontSize: 15, color: color.ink, letterSpacing: -0.3 }}>
          {Math.round(consumed)}
        </StatText>
        <StatText style={{ fontSize: 11, color: color.graphite }}> / {target}g</StatText>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: color.sageWash, overflow: 'hidden' }}>
        {protein ? (
          <LinearGradient
            colors={gradient.proteinBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 2 }}
          />
        ) : (
          <View style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 2, backgroundColor: color.sage }} />
        )}
      </View>
    </View>
  );
}

// Protein is always first and emphasized.
export function MacroBars({ totals, targets }: { totals: Macros; targets: DailyTargets }) {
  return (
    <View className="flex-row gap-5">
      <Bar label="Protein" consumed={totals.protein_g} target={targets.protein_g} protein />
      <Bar label="Carbs" consumed={totals.carb_g} target={targets.carb_g} />
      <Bar label="Fat" consumed={totals.fat_g} target={targets.fat_g} />
    </View>
  );
}
