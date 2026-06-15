import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../../theme';

// Opaque, full-bleed warm-gradient screen background.
// IMPORTANT: each routed screen must paint its OWN opaque background — on web the
// tab navigator keeps inactive scenes mounted, so transparent screens bleed
// through and overlap. This wrapper guarantees the active screen covers them.
export function Screen({
  children,
  edges = ['top'],
}: {
  children: React.ReactNode;
  edges?: Edge[];
}) {
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={gradient.appBg}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}
