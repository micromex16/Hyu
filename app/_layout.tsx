import '../global.css';
import 'react-native-gesture-handler';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Jost_300Light, Jost_400Regular } from '@expo-google-fonts/jost';
import {
  HankenGrotesk_300Light,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { AuthProvider } from '../lib/auth';
import { Loading } from '../components/Loading';
import { gradient } from '../theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Jost_300Light,
    Jost_400Regular,
    HankenGrotesk_300Light,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Warm radial-ish canvas behind the whole navigator. */}
        <LinearGradient
          colors={gradient.appBg}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <StatusBar style="dark" />
        {!fontsLoaded ? (
          <Loading />
        ) : (
          <AuthProvider>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                }}
              >
                <Stack.Screen name="(app)" />
                <Stack.Screen name="(auth)" />
              </Stack>
            </View>
          </AuthProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
