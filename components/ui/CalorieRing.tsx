import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, AccessibilityInfo, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { color, font, gradient } from '../../theme';
import { StatText } from './StatText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 158;
const R = 65;
const STROKE = 11;
const CIRC = 2 * Math.PI * R; // ≈ 408

export function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min(consumed / safeTarget, 1);
  const over = consumed > target && target > 0;
  const anim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || Platform.OS === 'web') {
      anim.setValue(pct);
      return;
    }
    Animated.timing(anim, {
      toValue: pct,
      duration: 1300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, reduceMotion, anim]);

  const dashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRC, 0],
  });

  return (
    <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="sg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={over ? color.bronze : gradient.sageRing[0]} />
            <Stop offset="1" stopColor={over ? color.bronzeGlow : gradient.sageRing[1]} />
          </SvgGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={color.sageWash} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="url(#sg)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashoffset}
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <StatText style={{ fontSize: 33, color: color.ink }}>{consumed.toLocaleString()}</StatText>
      <Text
        style={{
          fontFamily: font.mono,
          fontSize: 10.5,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: color.graphite,
          marginTop: 2,
        }}
      >
        of {target.toLocaleString()}
      </Text>
    </View>
  );
}
