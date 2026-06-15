import { View, type ViewProps } from 'react-native';
import { color, radius, shadow } from '../../theme';

// Porcelain raised surface with hairline border and soft warm shadow.
export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: color.porcelain,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: color.hair,
          padding: 20,
          ...shadow.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
