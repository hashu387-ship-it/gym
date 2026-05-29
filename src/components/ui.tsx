/**
 * Static UI primitives: typography, cards, section headers, pills, dividers,
 * stat tiles, and key/value rows. All theme-aware via `useTheme`.
 */

import React from 'react';
import { StyleSheet, Text, type TextProps, View, type ViewProps } from 'react-native';

import { Radius, Spacing, type ThemeColor, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = keyof typeof Type;

export function AppText({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: ThemeColor }) {
  const theme = useTheme();
  const t = Type[variant];
  return (
    <Text
      style={[
        { color: theme[color], fontSize: t.fontSize, lineHeight: t.lineHeight, fontWeight: t.fontWeight },
        style,
      ]}
      {...rest}
    />
  );
}

export function Card({
  style,
  elevated,
  children,
  ...rest
}: ViewProps & { elevated?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? theme.cardElevated : theme.card,
          borderRadius: Radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          padding: Spacing.five,
        },
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  caption,
  right,
}: {
  title: string;
  caption?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.flex}>
        <AppText variant="heading">{title}</AppText>
        {caption ? (
          <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
            {caption}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );
}

type PillTone = 'default' | 'primary' | 'amber' | 'success' | 'danger';

export function Pill({ label, tone = 'default' }: { label: string; tone?: PillTone }) {
  const theme = useTheme();
  const map: Record<PillTone, { bg: ThemeColor; fg: ThemeColor }> = {
    default: { bg: 'backgroundElement', fg: 'textSecondary' },
    primary: { bg: 'primarySoft', fg: 'primary' },
    amber: { bg: 'amberSoft', fg: 'amber' },
    success: { bg: 'successSoft', fg: 'success' },
    danger: { bg: 'dangerSoft', fg: 'danger' },
  };
  const { bg, fg } = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: theme[bg] }]}>
      <Text style={[styles.pillText, { color: theme[fg] }]}>{label}</Text>
    </View>
  );
}

export function Divider({ spacing = Spacing.four }: { spacing?: number }) {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginVertical: spacing }} />;
}

export function StatTile({
  label,
  value,
  sub,
  color = 'text',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: ThemeColor;
}) {
  return (
    <View style={styles.flex}>
      <AppText variant="micro" color="textMuted" style={styles.upper}>
        {label}
      </AppText>
      <AppText variant="metric" color={color} style={{ marginTop: Spacing.one }}>
        {value}
      </AppText>
      {sub ? (
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}

export function KeyValueRow({
  label,
  value,
  valueColor = 'text',
}: {
  label: string;
  value: string;
  valueColor?: ThemeColor;
}) {
  return (
    <View style={styles.kvRow}>
      <AppText variant="body" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyStrong" color={valueColor}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
});
