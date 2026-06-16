import { Pressable, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { color, font, radius, shadow, gradient } from '../../theme';

type Variant = 'primary' | 'ink';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: object;
}) {
  const colors = variant === 'primary' ? gradient.sage : gradient.ink;
  const textColor = variant === 'primary' ? color.porcelain : color.bone;

  function handlePress() {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height: 54,
          borderRadius: radius.control,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
          ...shadow.raised,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View pointerEvents="none">
        <Text
          style={{
            fontFamily: font.monoMed,
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: textColor,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
