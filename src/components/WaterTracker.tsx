/**
 * Daily water tracker: an animated progress bar toward the ~3 L target with
 * quick add/undo controls. Persistence is handled by the parent via `onAdd`.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ProgressBar';
import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const WATER_TARGET_ML = 3000;
const GLASS_ML = 250;

export function WaterTracker({
  ml,
  targetMl = WATER_TARGET_ML,
  onAdd,
}: {
  ml: number;
  targetMl?: number;
  onAdd: (deltaMl: number) => void;
}) {
  const theme = useTheme();
  const litres = (ml / 1000).toFixed(2);
  const targetLitres = (targetMl / 1000).toFixed(1);

  const add = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    onAdd(delta);
  };

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={styles.headRow}>
        <AppText variant="bodyStrong">
          {litres} L
          <AppText variant="caption" color="textMuted">
            {`  of ${targetLitres} L`}
          </AppText>
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {Math.round((ml / targetMl) * 100)}%
        </AppText>
      </View>
      <ProgressBar progress={ml / targetMl} color={theme.water} height={10} />
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel="Remove one glass of water"
          onPress={() => add(-GLASS_ML)}
          style={({ pressed }) => [styles.iconBtn, { borderColor: theme.border }, pressed && { opacity: 0.6 }]}>
          <Ionicons name="remove" size={20} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => add(GLASS_ML)}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.water }, pressed && { opacity: 0.85 }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <AppText variant="caption" style={{ color: '#FFFFFF' }}>
            Glass (250 ml)
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => add(GLASS_ML * 2)}
          style={({ pressed }) => [styles.iconBtn, { borderColor: theme.border, paddingHorizontal: Spacing.three }, pressed && { opacity: 0.6 }]}>
          <AppText variant="caption" color="textSecondary">
            +500 ml
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconBtn: {
    height: 40,
    minWidth: 40,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
  },
});
