import { View, Text, Pressable } from 'react-native';
import { color, font } from '../../theme';
import { StatText } from './StatText';

// Left thumb tile, middle name/serving, right kcal + protein (protein in sageDeep).
export function FoodItem({
  name,
  detail,
  kcal,
  protein,
  hairline = true,
  onLongPress,
}: {
  name: string;
  detail: string;
  kcal: number;
  protein: number;
  hairline?: boolean;
  onLongPress?: () => void;
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <Pressable
      onLongPress={onLongPress}
      className="flex-row items-center py-2.5 active:opacity-70"
      style={hairline ? { borderTopWidth: 1, borderTopColor: color.hair } : undefined}
    >
      <View
        style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: color.sageWash }}
        className="items-center justify-center"
      >
        <Text style={{ fontFamily: font.monoMed, fontSize: 13, color: color.sageDeep }}>{initial}</Text>
      </View>
      <View className="ml-3 flex-1 pr-3">
        <Text style={{ fontFamily: font.ui, fontSize: 14, color: color.ink }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontFamily: font.ui, fontSize: 12, color: color.graphite }} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <View className="items-end">
        <StatText style={{ fontSize: 13, color: color.ink }}>{kcal}</StatText>
        <StatText style={{ fontSize: 11, color: color.sageDeep }}>{Math.round(protein)}P</StatText>
      </View>
    </Pressable>
  );
}
