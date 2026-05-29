/**
 * A tappable row with a check toggle and a light haptic on change. Used for
 * meal items and workout exercise check-offs.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function CheckRow({
  done,
  onToggle,
  title,
  subtitle,
  right,
}: {
  done: boolean;
  onToggle: (next: boolean) => void;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const theme = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(!done);
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View
        style={[
          styles.box,
          {
            borderColor: done ? theme.primary : theme.border,
            backgroundColor: done ? theme.primary : 'transparent',
          },
        ]}>
        {done ? <Ionicons name="checkmark" size={15} color={theme.onPrimary} /> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={done ? 'textSecondary' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.half }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  box: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
