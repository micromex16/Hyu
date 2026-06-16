import { View, type ViewProps } from 'react-native';
import { color, radius, shadow, hairlineBorder } from '../../theme';

// Porcelain raised surface. Borderless feel: a near-invisible hairline for edge
// crispness on light-on-light, plus a whisper-soft warm shadow so it floats.
export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: color.porcelain,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: hairlineBorder,
          padding: 22,
          ...shadow.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
