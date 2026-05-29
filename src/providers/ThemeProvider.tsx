/**
 * Resolves the active colour scheme from the user's preference (system / light
 * / dark) plus the device scheme, and exposes the matching palette.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

import { Colors, type ColorScheme, type Palette } from '@/constants/theme';
import { useAppData } from '@/providers/AppDataProvider';

interface ThemeValue {
  scheme: ColorScheme;
  colors: Palette;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const device = useDeviceColorScheme();
  const { profile } = useAppData();

  const scheme: ColorScheme =
    profile.themePreference === 'system'
      ? device === 'dark'
        ? 'dark'
        : 'light'
      : profile.themePreference;

  const value = useMemo<ThemeValue>(
    () => ({ scheme, colors: Colors[scheme] }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeValue | null {
  return useContext(ThemeContext);
}
