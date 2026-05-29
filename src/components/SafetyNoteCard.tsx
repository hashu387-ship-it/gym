/**
 * Renders a safety status note. Amber notes use the warning palette; an "ok"
 * note uses a calm, encouraging primary tint. Never alarming, never shaming.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SafetyNote } from '@/types';

export function SafetyNoteCard({ note }: { note: SafetyNote }) {
  const theme = useTheme();
  const amber = note.level === 'amber';

  const bg = amber ? theme.amberSoft : theme.primarySoft;
  const border = amber ? theme.amberBorder : theme.primary;
  const fg = amber ? theme.amber : theme.primary;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons
        name={amber ? 'alert-circle-outline' : 'shield-checkmark-outline'}
        size={20}
        color={fg}
        style={{ marginTop: 1 }}
      />
      <View style={styles.flex}>
        <AppText variant="bodyStrong" style={{ color: fg }}>
          {note.title}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.one }}>
          {note.message}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
