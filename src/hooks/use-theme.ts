/**
 * Returns the active palette. Prefers the resolved app theme (which honours the
 * user's light/dark/system preference) and falls back to the device scheme when
 * used outside the ThemeProvider.
 */

import { Colors, type ColorScheme, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeContext } from '@/providers/ThemeProvider';

export function useTheme(): Palette {
  const ctx = useThemeContext();
  const device = useColorScheme();
  if (ctx) return ctx.colors;
  return Colors[device === 'dark' ? 'dark' : 'light'];
}

/** The active scheme name ('light' | 'dark'). */
export function useColorSchemeName(): ColorScheme {
  const ctx = useThemeContext();
  const device = useColorScheme();
  return ctx?.scheme ?? (device === 'dark' ? 'dark' : 'light');
}
