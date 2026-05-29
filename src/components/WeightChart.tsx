/**
 * Weight history line chart (react-native-svg) with the projected sustainable
 * trend overlaid and the goal line marked. The actual-weight line draws itself
 * in with reanimated by animating the stroke dash offset.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysBetween, formatShortDate } from '@/logic/dates';
import { formatWeightValue } from '@/logic/format';
import type { TrendPoint } from '@/logic/progress';
import type { Units, WeightEntry } from '@/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const HEIGHT = 220;
const PAD = { top: 16, right: 14, bottom: 26, left: 38 };

interface XY {
  x: number;
  y: number;
}

function polylineLength(points: XY[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

function toPath(points: XY[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function WeightChart({
  entries,
  projected,
  goalKg,
  units = 'metric',
}: {
  entries: WeightEntry[];
  projected: TrendPoint[];
  goalKg?: number;
  units?: Units;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const draw = useSharedValue(0);
  // Re-run the draw-in animation whenever the data or width changes.
  const dataKey = `${entries.length}:${width}:${entries[entries.length - 1]?.date ?? ''}`;
  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 900 });
  }, [dataKey, draw]);

  const model = useMemo(() => {
    if (width <= 0 || entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    const allDates = [...sorted.map((e) => e.date), ...projected.map((p) => p.date)];
    const minDate = allDates.reduce((a, b) => (a < b ? a : b));
    const maxDate = allDates.reduce((a, b) => (a > b ? a : b));
    const spanDays = Math.max(1, daysBetween(minDate, maxDate));

    const allKg = [
      ...sorted.map((e) => e.kg),
      ...projected.map((p) => p.kg),
      ...(goalKg != null ? [goalKg] : []),
    ];
    const minKg = Math.min(...allKg) - 1;
    const maxKg = Math.max(...allKg) + 1;
    const kgSpan = Math.max(1, maxKg - minKg);

    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;

    const xFor = (date: string) => PAD.left + (daysBetween(minDate, date) / spanDays) * plotW;
    const yFor = (kg: number) => PAD.top + (1 - (kg - minKg) / kgSpan) * plotH;

    const actual: XY[] = sorted.map((e) => ({ x: xFor(e.date), y: yFor(e.kg) }));
    const trend: XY[] = projected.map((p) => ({ x: xFor(p.date), y: yFor(p.kg) }));

    return {
      actual,
      trend,
      length: polylineLength(actual),
      minKg,
      maxKg,
      goalY: goalKg != null ? yFor(goalKg) : null,
      firstDate: minDate,
      lastDate: maxDate,
      plotRight: PAD.left + plotW,
    };
  }, [entries, projected, goalKg, width]);

  const animatedProps = useAnimatedProps(() => {
    const len = model?.length ?? 0;
    return { strokeDashoffset: len * (1 - draw.value) };
  });

  if (entries.length < 2) {
    return (
      <View style={[styles.empty, { borderColor: theme.border }]} onLayout={onLayout}>
        <AppText variant="body" color="textSecondary" style={styles.emptyText}>
          Log your weight on at least two days to see your trend here. Watch the weekly
          average, not the daily number.
        </AppText>
      </View>
    );
  }

  return (
    <View onLayout={onLayout}>
      {model ? (
        <Svg width={width} height={HEIGHT}>
          {/* Y axis bounds */}
          <SvgText x={4} y={PAD.top + 4} fontSize={10} fill={theme.textMuted}>
            {formatWeightValue(model.maxKg, units)}
          </SvgText>
          <SvgText x={4} y={HEIGHT - PAD.bottom} fontSize={10} fill={theme.textMuted}>
            {formatWeightValue(model.minKg, units)}
          </SvgText>

          {/* Goal line */}
          {model.goalY != null ? (
            <Line
              x1={PAD.left}
              y1={model.goalY}
              x2={model.plotRight}
              y2={model.goalY}
              stroke={theme.success}
              strokeWidth={1}
              strokeDasharray="2 5"
            />
          ) : null}

          {/* Projected sustainable trend (dashed) */}
          <Path
            d={toPath(model.trend)}
            stroke={theme.textMuted}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
          />

          {/* Actual weight line (animated draw-in) */}
          <AnimatedPath
            d={toPath(model.actual)}
            stroke={theme.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={model.length}
            animatedProps={animatedProps}
          />

          {/* Data points */}
          {model.actual.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={2.5} fill={theme.primary} />
          ))}

          {/* X axis end labels */}
          <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={10} fill={theme.textMuted}>
            {formatShortDate(model.firstDate)}
          </SvgText>
          <SvgText
            x={model.plotRight}
            y={HEIGHT - 6}
            fontSize={10}
            fill={theme.textMuted}
            textAnchor="end">
            {formatShortDate(model.lastDate)}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
      <View style={styles.legend}>
        <Legend color={theme.primary} label="Logged weight" />
        <Legend color={theme.textMuted} label="Sustainable trend" dashed />
        {goalKg != null ? <Legend color={theme.success} label="Goal" dashed /> : null}
      </View>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: dashed ? 'transparent' : color, borderColor: color },
        ]}
      />
      <AppText variant="micro" color="textSecondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: HEIGHT,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  emptyText: { textAlign: 'center' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
    marginTop: Spacing.three,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  legendSwatch: { width: 14, height: 3, borderRadius: 2, borderWidth: 1.5 },
});
