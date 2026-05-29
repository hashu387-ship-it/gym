/**
 * A labelled numeric stepper with minus/plus controls, clamped to a range.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { clamp } from '@/logic/format';
import { useTheme } from '@/hooks/use-theme';

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
}) {
  const theme = useTheme();

  const set = (next: number) => {
    const clamped = clamp(Math.round(next * 1000) / 1000, min, max);
    if (clamped !== value) Haptics.selectionAsync().catch(() => {});
    onChange(clamped);
  };

  return (
    <View style={styles.row}>
      <AppText variant="body" color="textSecondary" style={styles.flex}>
        {label}
      </AppText>
      <View style={styles.controls}>
        <Pressable
          onPress={() => set(value - step)}
          style={({ pressed }) => [styles.btn, { borderColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Ionicons name="remove" size={18} color={theme.textSecondary} />
        </Pressable>
        <AppText variant="bodyStrong" style={styles.value}>
          {format ? format(value) : String(value)}
        </AppText>
        <Pressable
          onPress={() => set(value + step)}
          style={({ pressed }) => [styles.btn, { borderColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Ionicons name="add" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two },
  flex: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  btn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 84, textAlign: 'center' },
});
