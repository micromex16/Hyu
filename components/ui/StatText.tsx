import { Text, type TextProps } from 'react-native';
import { font } from '../../theme';

// Forces Geist Mono + tabular numerals for EVERY number in the app.
// Rule: if a number isn't rendered through this (or font-mono + tabular), it's a bug.
export function StatText({ style, medium, ...props }: TextProps & { medium?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: medium ? font.monoMed : font.mono, fontVariant: ['tabular-nums'] },
        style,
      ]}
    />
  );
}
