/**
 * Progress: log today's weight, see the trend chart with the projected
 * sustainable path, weekly averages, streak, and milestone markers.
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { WeightChart } from '@/components/WeightChart';
import { AppText, Card, Divider, KeyValueRow, Pill, StatTile } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { getWeights, upsertWeight } from '@/db/database';
import { formatLongDate, todayISO } from '@/logic/dates';
import { clamp, formatWeight, formatWeightValue } from '@/logic/format';
import { computeNutritionTargets } from '@/logic/nutrition';
import {
  averageWeeklyChangeKg,
  latestWeight,
  loggingStreak,
  milestones,
  projectedTrend,
  totalChangeKg,
  weeklyAverages,
} from '@/logic/progress';
import { currentWeightKg } from '@/logic/selectors';
import { useScreenData } from '@/hooks/use-screen-data';
import { useAppData } from '@/providers/AppDataProvider';
import { useTheme } from '@/hooks/use-theme';
import type { WeightEntry } from '@/types';

export default function ProgressScreen() {
  const { profile, refresh } = useAppData();
  const theme = useTheme();
  const today = todayISO();
  const units = profile.units;

  const [weights] = useScreenData<WeightEntry[]>(() => getWeights(), [], [today]);
  const [input, setInput] = useState('');

  const weightNow = currentWeightKg(profile, weights);
  const targets = computeNutritionTargets(profile, weightNow);

  const sorted = useMemo(
    () => [...weights].sort((a, b) => a.date.localeCompare(b.date)),
    [weights],
  );
  const loggedToday = sorted.find((w) => w.date === today);

  const trend = useMemo(() => {
    if (sorted.length === 0) return [];
    const first = sorted[0];
    const endDate = today > first.date ? today : first.date;
    return projectedTrend(first.kg, first.date, targets.estimatedWeeklyLossKg, endDate);
  }, [sorted, targets.estimatedWeeklyLossKg, today]);

  const weeks = weeklyAverages(sorted);
  const streak = loggingStreak(sorted.map((w) => w.date), today);
  const totalChange = totalChangeKg(sorted);
  const avgWeekly = averageWeeklyChangeKg(sorted);
  const ms = milestones(profile.startWeightKg, profile.goalWeightKg, weightNow);

  const save = () => {
    const kg = parseFloat(input.replace(',', '.'));
    if (!Number.isFinite(kg)) return;
    upsertWeight(today, clamp(kg, 30, 400))
      .then(() => {
        setInput('');
        refresh();
      })
      .catch(() => {});
  };

  return (
    <Screen title="Progress" subtitle="Judge by the weekly average">
      {/* Log weight */}
      <Card>
        <AppText variant="heading">Log today's weight</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          {loggedToday
            ? `Logged today: ${formatWeight(loggedToday.kg, units)}. Saving again updates it.`
            : formatLongDate(today)}
        </AppText>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            keyboardType="decimal-pad"
            placeholder={formatWeightValue(weightNow, units)}
            placeholderTextColor={theme.textMuted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          />
          <AppText variant="body" color="textSecondary">
            kg
          </AppText>
          <Button title="Log" onPress={save} style={styles.logBtn} />
        </View>
      </Card>

      {/* Chart */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Weight trend
        </AppText>
        <WeightChart entries={sorted} projected={trend} goalKg={profile.goalWeightKg} units={units} />
      </Card>

      {/* Stats */}
      <Card>
        <View style={styles.statRow}>
          <StatTile label="Latest" value={latestWeight(sorted) ? formatWeight(latestWeight(sorted)!.kg, units) : '--'} />
          <StatTile
            label="Total change"
            value={`${totalChange > 0 ? '+' : totalChange < 0 ? '-' : ''}${formatWeight(Math.abs(totalChange), units)}`}
            color={totalChange <= 0 ? 'success' : 'text'}
          />
        </View>
        <Divider spacing={Spacing.four} />
        <View style={styles.statRow}>
          <StatTile
            label="Avg / week"
            value={`${avgWeekly > 0 ? '+' : avgWeekly < 0 ? '-' : ''}${formatWeight(Math.abs(avgWeekly), units)}`}
            color={avgWeekly < 0 ? 'success' : 'text'}
          />
          <StatTile label="Logging streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
        </View>
      </Card>

      {/* Weekly averages */}
      {weeks.length > 0 ? (
        <Card>
          <AppText variant="heading" style={{ marginBottom: Spacing.two }}>
            Weekly averages
          </AppText>
          {weeks.slice(-6).reverse().map((w) => (
            <KeyValueRow key={w.weekKey} label={w.weekKey} value={`${formatWeight(w.avgKg, units)} (${w.count})`} />
          ))}
        </Card>
      ) : null}

      {/* Milestones */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Milestones
        </AppText>
        <View style={styles.milestones}>
          {ms.map((m) => {
            const isGoal = m.label.startsWith('Goal');
            const display = isGoal
              ? `Goal ${formatWeight(m.kg, units)}`
              : `-${formatWeight(profile.startWeightKg - m.kg, units)}`;
            return (
              <View key={m.label} style={styles.milestone}>
                <Pill label={display} tone={m.achieved ? 'success' : 'default'} />
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: Spacing.three },
  input: {
    flex: 1,
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    fontSize: 18,
    fontWeight: '600',
  },
  logBtn: { paddingHorizontal: Spacing.five },
  statRow: { flexDirection: 'row', gap: Spacing.four },
  milestones: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  milestone: {},
});
