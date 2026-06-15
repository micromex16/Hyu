import { ExpoConfig, ConfigContext } from 'expo/config';

// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for app identity. To rename the app, change these.
// ─────────────────────────────────────────────────────────────────────────────
const APP_NAME = 'Hyu';
const APP_SLUG = 'hyu';
const APP_SCHEME = 'hyu'; // deep-link scheme, used by Supabase magic-link redirect
const BUNDLE_ID = 'com.hyu.app';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
    infoPlist: {
      // HealthKit (wired in step 8 via react-native-health). Strings required up-front.
      NSHealthShareUsageDescription:
        'Hyu reads your bodyweight, steps, and active energy to track progress and personalize your nutrition targets.',
      NSHealthUpdateUsageDescription:
        'Hyu writes bodyweight and nutrition data so it stays in sync with Apple Health.',
      // Barcode scanning (step 6).
      NSCameraUsageDescription:
        'Hyu uses the camera to scan food barcodes for fast logging.',
    },
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#0E0F12',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['CAMERA'],
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0E0F12',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      // projectId filled in by `eas init`
    },
  },
});
