import { View, Text, Pressable } from 'react-native';
import { color, font } from '../../theme';
import { Card } from './Card';
import { Eyebrow } from './Eyebrow';
import { StatText } from './StatText';

// Card with a meal header (name + kcal pill) wrapping FoodItem rows.
export function MealCard({
  title,
  kcal,
  onAdd,
  children,
}: {
  title: string;
  kcal: number;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ paddingVertical: 16 }}>
      <View className="flex-row items-center justify-between">
        <Eyebrow>{title}</Eyebrow>
        <View className="flex-row items-center gap-3">
          <View style={{ backgroundColor: color.sageWash, borderRadius: 999 }} className="px-2.5 py-1">
            <StatText style={{ fontSize: 11, color: color.sageDeep }}>{kcal} kcal</StatText>
          </View>
          {onAdd ? (
            <Pressable onPress={onAdd} hitSlop={8} className="active:opacity-60">
              <Text style={{ fontFamily: font.uiLight, fontSize: 22, color: color.sageDeep, lineHeight: 24 }}>+</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View className="mt-1">{children}</View>
    </Card>
  );
}

// Soft "invitation" row for an empty meal (clean filled tile, no dashed border).
export function EmptyMealRow({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-2 flex-row items-center justify-center py-3 active:opacity-60"
      style={{ backgroundColor: color.porcelain2, borderRadius: 12 }}
    >
      <Text style={{ fontFamily: font.uiMed, fontSize: 13, color: color.sageDeep }}>+ {label}</Text>
    </Pressable>
  );
}
