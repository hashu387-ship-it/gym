/**
 * Animated circular progress ring (react-native-svg + reanimated) and a labelled
 * `RingStat` built on top of it for the calories/protein/carbs/fat displays.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MacroRing({
  size = 120,
  strokeWidth = 12,
  progress,
  color,
  trackColor,
  children,
}: {
  size?: number;
  strokeWidth?: number;
  /** 0..1; values above 1 are clamped for the visual fill. */
  progress: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(clamped, { duration: 800 });
  }, [clamped, t]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - t.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor ?? theme.backgroundElement}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            fill="none"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>{children}</View>
      </View>
    </View>
  );
}

/** A ring with a centred value and a label underneath. */
export function RingStat({
  label,
  value,
  sub,
  progress,
  colorKey,
  size = 104,
}: {
  label: string;
  value: string;
  sub?: string;
  progress: number;
  colorKey: ThemeColor;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.ringStat}>
      <MacroRing size={size} strokeWidth={10} progress={progress} color={theme[colorKey]}>
        <AppText variant="subheading">{value}</AppText>
        {sub ? (
          <AppText variant="micro" color="textMuted">
            {sub}
          </AppText>
        ) : null}
      </MacroRing>
      <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.two }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringStat: { alignItems: 'center', flex: 1 },
});
