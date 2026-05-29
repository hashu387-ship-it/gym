/**
 * Horizontal progress bar that animates its fill width with reanimated.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
}: {
  /** 0..1 (values outside are clamped). */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const theme = useTheme();
  const width = useSharedValue(0);

  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 650 });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: Radius.pill, backgroundColor: trackColor ?? theme.backgroundElement },
      ]}>
      <Animated.View
        style={[
          { height, borderRadius: Radius.pill, backgroundColor: color ?? theme.primary },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
