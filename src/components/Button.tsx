/**
 * Pressable button with calm styling, optional loading state, and a subtle
 * selection haptic on press.
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  haptic = true,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const palette: Record<Variant, { bg: ThemeColor | 'transparent'; fg: ThemeColor; border?: ThemeColor }> = {
    primary: { bg: 'primary', fg: 'onPrimary' },
    secondary: { bg: 'backgroundElement', fg: 'text' },
    ghost: { bg: 'transparent', fg: 'primary', border: 'border' },
    danger: { bg: 'dangerSoft', fg: 'danger' },
  };
  const p = palette[variant];

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg === 'transparent' ? 'transparent' : theme[p.bg],
          borderColor: p.border ? theme[p.border] : 'transparent',
          borderWidth: p.border ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme[p.fg]} />
      ) : (
        <View style={styles.content}>
          <AppText variant="bodyStrong" color={p.fg}>
            {title}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
