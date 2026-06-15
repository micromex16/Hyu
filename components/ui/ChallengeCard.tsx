import { View, Text } from 'react-native';
import { color, font } from '../../theme';
import { DarkCard } from './DarkCard';
import { Eyebrow } from './Eyebrow';
import { StatText } from './StatText';

// Challenge summary on a dark surface. Rank 1 is the bronze (achievement) moment.
export function ChallengeCard({
  name,
  rank,
  points,
  note,
}: {
  name: string;
  rank: number;
  points: number;
  note?: string;
}) {
  const leader = rank === 1;
  return (
    <DarkCard>
      <Eyebrow tone="mist">{name}</Eyebrow>
      <View className="mt-3 flex-row items-end justify-between">
        <View className="flex-row items-baseline">
          <StatText
            medium
            style={{ fontSize: 15, color: leader ? color.bronzeGlow : color.sageMist }}
          >
            #{rank}
          </StatText>
          <Text
            style={{ fontFamily: font.ui, fontSize: 12, color: color.sageMist, marginLeft: 6 }}
          >
            your rank
          </Text>
        </View>
        <View className="flex-row items-baseline">
          <StatText medium style={{ fontSize: 30, color: color.porcelain }}>
            {points}
          </StatText>
          <Text style={{ fontFamily: font.mono, fontSize: 10.5, color: color.sageMist, marginLeft: 4 }}>
            PTS
          </Text>
        </View>
      </View>
      {note ? (
        <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.sageMist, marginTop: 10 }}>
          {note}
        </Text>
      ) : null}
    </DarkCard>
  );
}
