/**
 * A compact segmented control for small mutually-exclusive choices (units, sex,
 * theme preference). Subtle selection haptic on change.
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (!selected) Haptics.selectionAsync().catch(() => {});
              onChange(opt.value);
            }}
            style={[
              styles.item,
              selected && { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <AppText variant="caption" color={selected ? 'text' : 'textSecondary'}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: Radius.md, gap: 3 },
  item: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
});
