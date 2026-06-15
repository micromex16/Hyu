import { View, Pressable, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { color, font } from '../../theme';

// Minimal shape of the props expo-router's Tabs passes to a custom tabBar.
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

const META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { label: 'Home', icon: 'home-outline' },
  food: { label: 'Food', icon: 'restaurant-outline' },
  profile: { label: 'You', icon: 'person-outline' },
};

// Translucent porcelain tab bar with a hairline top border and line icons.
export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={Platform.OS === 'web' ? 0 : 40}
      tint="light"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: insets.bottom || 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: color.hair,
        backgroundColor: Platform.OS === 'web' ? 'rgba(250,248,244,0.92)' : 'rgba(250,248,244,0.7)',
      }}
    >
      <View className="flex-row">
        {state.routes.map((route, index) => {
          const meta = META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const tint = focused ? color.sageDeep : color.graphite;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              className="flex-1 items-center gap-1 active:opacity-60"
            >
              <Ionicons name={meta.icon} size={22} color={tint} />
              <Text
                style={{
                  fontFamily: font.mono,
                  fontSize: 9.5,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: tint,
                }}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BlurView>
  );
}
