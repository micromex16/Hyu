import { useState } from 'react';
import { Pressable, Text, View, Platform, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { color, font, radius, shadow, gradient } from '../../theme';

type Variant = 'primary' | 'ink';

// Rounded rect with three rounded corners and one chamfered (hewn) bottom-right.
function chamferPath(w: number, h: number, r: number, c: number): string {
  return [
    `M ${r} 0`,
    `L ${w - r} 0`,
    `A ${r} ${r} 0 0 1 ${w} ${r}`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L ${r} ${h}`,
    `A ${r} ${r} 0 0 1 0 ${h - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  chamfer = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  chamfer?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const colors = variant === 'primary' ? gradient.sage : gradient.ink;
  const textColor = variant === 'primary' ? color.porcelain : color.bone;

  function handlePress() {
    if (disabled) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }

  const labelEl = (
    <Text
      style={{
        fontFamily: font.monoMed,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: textColor,
      }}
    >
      {label}
    </Text>
  );

  return (
    <Pressable
      onPress={handlePress}
      onLayout={onLayout}
      disabled={disabled}
      style={[
        {
          height: 56,
          borderRadius: radius.control,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.45 : 1,
          ...shadow.card,
        },
        style,
      ]}
    >
      {chamfer && size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={{ position: 'absolute' }}>
          <Defs>
            <SvgGradient id="btn" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors[0]} />
              <Stop offset="1" stopColor={colors[1]} />
            </SvgGradient>
          </Defs>
          <Path d={chamferPath(size.w, size.h, radius.control, 16)} fill="url(#btn)" />
        </Svg>
      ) : (
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      <View pointerEvents="none">{labelEl}</View>
    </Pressable>
  );
}
