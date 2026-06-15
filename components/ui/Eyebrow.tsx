import { Text } from 'react-native';
import { color, font } from '../../theme';

// Geist Mono, uppercase, wide tracking. Sits above every section.
export function Eyebrow({
  children,
  tone = 'deep',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'deep' | 'graphite' | 'mist';
  className?: string;
}) {
  const c = tone === 'graphite' ? color.graphite : tone === 'mist' ? color.sageMist : color.sageDeep;
  return (
    <Text
      className={className}
      style={{
        fontFamily: font.mono,
        fontSize: 10.5,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color: c,
      }}
    >
      {children}
    </Text>
  );
}
