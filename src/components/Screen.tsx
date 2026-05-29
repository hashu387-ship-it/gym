/**
 * Standard screen scaffold: themed background, safe-area aware scrolling,
 * centred max-width content, an optional large in-content title, and a calm
 * fade-in for tab transitions.
 *
 * Rule of thumb: top-level tab screens pass a `title` (which also adds the top
 * safe-area inset); detail screens pushed under a native header omit `title`.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({
  title,
  subtitle,
  headerRight,
  children,
  scroll = true,
}: {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const header = title ? (
    <View style={styles.header}>
      <View style={styles.flex}>
        <AppText variant="display">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary" style={{ marginTop: Spacing.one }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {headerRight}
    </View>
  ) : null;

  const topPad = (title ? insets.top : 0) + Spacing.four;
  const bottomPad = insets.bottom + BottomTabInset + Spacing.six;

  const inner = (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.inner, { maxWidth: MaxContentWidth }]}>
      {header}
      {children}
    </Animated.View>
  );

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}>{inner}</View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}>
        {inner}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
