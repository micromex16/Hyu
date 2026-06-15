import { View, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, shadow, gradient } from '../../theme';

// Dark gradient surface with a faint bronze hairline along the top edge.
// Used for challenges.
export function DarkCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[{ borderRadius: radius.card, ...shadow.card }, style]} {...props}>
      <LinearGradient
        colors={gradient.darkCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: radius.card, padding: 20, overflow: 'hidden' }}
      >
        {/* bronze top hairline */}
        <LinearGradient
          colors={['rgba(201,166,105,0.4)', 'rgba(201,166,105,0)']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }}
        />
          {children}
      </LinearGradient>
    </View>
  );
}
