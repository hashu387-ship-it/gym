/**
 * Root layout: mounts providers (gesture handler, safe area, app data, theme),
 * configures the navigation stack, applies the navigation theme to match the
 * palette, and gates the app behind the one-time disclaimer.
 */

import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DisclaimerModal } from '@/components/DisclaimerModal';
import { type Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppDataProvider, useAppData } from '@/providers/AppDataProvider';
import { ThemeProvider, useThemeContext } from '@/providers/ThemeProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppDataProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </AppDataProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function buildNavigationTheme(scheme: 'light' | 'dark', theme: Palette) {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.tabBar,
      text: theme.text,
      border: theme.tabBarBorder,
      primary: theme.primary,
      notification: theme.danger,
    },
  };
}

function RootNavigator() {
  const { ready, appState, acceptDisclaimer } = useAppData();
  const themeCtx = useThemeContext();
  const theme = useTheme();
  const scheme = themeCtx?.scheme ?? 'light';

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={buildNavigationTheme(scheme, theme)}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[dayId]" options={{ title: 'Workout' }} />
        <Stack.Screen name="exercise/[exerciseId]" options={{ title: 'Exercise' }} />
      </Stack>
      <DisclaimerModal visible={!appState.disclaimerAccepted} onAccept={acceptDisclaimer} />
    </NavigationThemeProvider>
  );
}
