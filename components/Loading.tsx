import { View, ActivityIndicator } from 'react-native';
import { color } from '../theme';

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color={color.sage} size="large" />
    </View>
  );
}
