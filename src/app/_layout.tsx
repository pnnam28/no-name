import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import {AuthProvider} from '@/backend/AuthProvider'

import type { PropsWithChildren } from 'react';

// The development module is not loaded in release mode.
const DiagnosticsHost = __DEV__
  ? require('../debug/DevDiagnosticsHost').DevDiagnosticsHost
  : ({ children }: PropsWithChildren) => children;

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const color_scheme = useColorScheme();
  return (
    <ThemeProvider value={color_scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      <DiagnosticsHost>
      <AuthProvider>
        <Stack screenOptions = {{ headerShown:false}} />
      </AuthProvider>
      </DiagnosticsHost>

    </ThemeProvider>
  );
}
