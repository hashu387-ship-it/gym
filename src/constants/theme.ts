/**
 * FitTrack design tokens.
 *
 * A calm, low-contrast palette with semantic colour roles, full dark-mode
 * support, a spacing scale, type ramp, and corner radii. Light and dark share
 * the exact same key set so `ThemeColor` resolves cleanly.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    background: '#F6F8FA',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    backgroundElement: '#EEF2F6',
    backgroundSelected: '#E2E8F0',
    border: '#E5EAF0',
    primary: '#0E7490',
    primarySoft: '#E0F2F1',
    onPrimary: '#FFFFFF',
    accent: '#0EA5A4',
    success: '#15803D',
    successSoft: '#DCFCE7',
    amber: '#B45309',
    amberSoft: '#FEF3C7',
    amberBorder: '#FCD34D',
    danger: '#B91C1C',
    dangerSoft: '#FEE2E2',
    protein: '#0E7490',
    carbs: '#6366F1',
    fat: '#F59E0B',
    water: '#0EA5E9',
    overlay: 'rgba(15,23,42,0.45)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5EAF0',
  },
  dark: {
    text: '#E5ECF3',
    textSecondary: '#9AA7B6',
    textMuted: '#64748B',
    background: '#0B1220',
    card: '#121B2A',
    cardElevated: '#172234',
    backgroundElement: '#1B2638',
    backgroundSelected: '#243043',
    border: '#1E293B',
    primary: '#22D3C5',
    primarySoft: '#0E3B3A',
    onPrimary: '#052E2B',
    accent: '#2DD4BF',
    success: '#4ADE80',
    successSoft: '#10301E',
    amber: '#FBBF24',
    amberSoft: '#332606',
    amberBorder: '#92590B',
    danger: '#F87171',
    dangerSoft: '#3A1414',
    protein: '#2DD4BF',
    carbs: '#818CF8',
    fat: '#FBBF24',
    water: '#38BDF8',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#0E1726',
    tabBarBorder: '#1E293B',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
/** Structural palette type (string values) so light and dark are interchangeable. */
export type Palette = Record<ThemeColor, string>;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** 4-point spacing scale. */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

/** Corner radii. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

/** Type ramp: font size paired with line height and weight. */
export const Type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  subheading: { fontSize: 17, lineHeight: 23, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  metric: { fontSize: 30, lineHeight: 34, fontWeight: '700' as const },
} as const;

export const MaxContentWidth = 720;
export const BottomTabInset = Platform.select({ ios: 50, android: 70 }) ?? 0;
