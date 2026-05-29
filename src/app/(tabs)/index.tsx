/**
 * Dashboard: current vs target weight, calories and macros remaining today,
 * today's workout summary, water progress, and a calm safety status note.
 */

import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { MacroRing, RingStat } from '@/components/MacroRing';
import { SafetyNoteCard } from '@/components/SafetyNoteCard';
import { Screen } from '@/components/Screen';
import { WaterTracker } from '@/components/WaterTracker';
import { AppText, Card, KeyValueRow, Pill } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { CARDIO_GUIDANCE } from '@/logic/cardio';
import { addWater, getCompletions, getWater, getWeights } from '@/db/database';
import { computeItem } from '@/data/mealPlan';
import { formatLongDate, todayISO } from '@/logic/dates';
import { formatKcal, formatWeight, roundInt } from '@/logic/format';
import { computeNutritionTargets, summarizeSafety } from '@/logic/nutrition';
import { currentWeightKg, mealDayForDate, workoutDayForDate } from '@/logic/selectors';
import { useAppData } from '@/providers/AppDataProvider';
import { useScreenData } from '@/hooks/use-screen-data';
import type { WeightEntry } from '@/types';

interface DashboardData {
  weights: WeightEntry[];
  mealDone: Record<string, boolean>;
  water: number;
}

export default function DashboardScreen() {
  const { profile, refresh } = useAppData();
  const today = todayISO();
  const planDay = useMemo(() => mealDayForDate(today), [today]);
  const workoutDay = useMemo(() => workoutDayForDate(today), [today]);

  const [data] = useScreenData<DashboardData>(
    async () => ({
      weights: await getWeights(),
      mealDone: await getCompletions(today, 'meal'),
      water: await getWater(today),
    }),
    { weights: [], mealDone: {}, water: 0 },
    [today],
  );

  const weightNow = currentWeightKg(profile, data.weights);
  const targets = computeNutritionTargets(profile, weightNow);

  // Sum what has been checked off today.
  const consumed = useMemo(() => {
    let kcal = 0, proteinG = 0, carbsG = 0, fatG = 0;
    for (const meal of planDay.meals) {
      for (const item of meal.items) {
        if (data.mealDone[item.id]) {
          const c = computeItem(item);
          kcal += c.kcal;
          proteinG += c.proteinG;
          carbsG += c.carbsG;
          fatG += c.fatG;
        }
      }
    }
    return { kcal, proteinG, carbsG, fatG };
  }, [planDay, data.mealDone]);

  const safety = summarizeSafety(consumed.kcal, targets);
  const sinceStart = weightNow - profile.startWeightKg;

  const remaining = (target: number, used: number) => Math.max(0, Math.round(target - used));

  const onAddWater = (delta: number) => {
    addWater(today, delta).then(refresh).catch(() => {});
  };

  return (
    <Screen title="Today" subtitle={formatLongDate(today)}>
      <SafetyNoteCard note={safety} />

      {/* Weight */}
      <Card>
        <View style={styles.weightRow}>
          <View style={styles.flex}>
            <AppText variant="micro" color="textMuted" style={styles.upper}>
              Current weight
            </AppText>
            <AppText variant="display" style={{ marginTop: Spacing.one }}>
              {formatWeight(weightNow, profile.units)}
            </AppText>
            <AppText variant="caption" color={sinceStart <= 0 ? 'success' : 'textSecondary'} style={{ marginTop: Spacing.one }}>
              {sinceStart === 0
                ? 'No change logged yet'
                : `${sinceStart < 0 ? '-' : '+'}${formatWeight(Math.abs(sinceStart), profile.units)} since start`}
            </AppText>
          </View>
          <View style={styles.goalBox}>
            <AppText variant="micro" color="textMuted" style={styles.upper}>
              Goal
            </AppText>
            <AppText variant="heading" color="primary" style={{ marginTop: Spacing.one }}>
              {formatWeight(profile.goalWeightKg, profile.units)}
            </AppText>
          </View>
        </View>
        <AppText
          variant="caption"
          color="primary"
          style={{ marginTop: Spacing.three }}
          onPress={() => router.navigate('/progress')}>
          Log today's weight in Progress
        </AppText>
      </Card>

      {/* Calories and macros remaining */}
      <Card>
        <AppText variant="heading">Remaining today</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          Check meals off in Nutrition to fill these rings.
        </AppText>
        <View style={styles.rings}>
          <RingStat
            label="Calories"
            value={String(remaining(targets.recommendedCalories, consumed.kcal))}
            sub={`/ ${roundInt(targets.recommendedCalories)}`}
            progress={consumed.kcal / targets.recommendedCalories}
            colorKey="primary"
            size={96}
          />
          <RingStat
            label="Protein"
            value={`${remaining(targets.proteinG, consumed.proteinG)}g`}
            progress={consumed.proteinG / targets.proteinG}
            colorKey="protein"
            size={96}
          />
        </View>
        <View style={styles.rings}>
          <RingStat
            label="Carbs"
            value={`${remaining(targets.carbsG, consumed.carbsG)}g`}
            progress={consumed.carbsG / targets.carbsG}
            colorKey="carbs"
            size={96}
          />
          <RingStat
            label="Fat"
            value={`${remaining(targets.fatG, consumed.fatG)}g`}
            progress={consumed.fatG / targets.fatG}
            colorKey="fat"
            size={96}
          />
        </View>
        <KeyValueRow label="Eaten so far" value={formatKcal(consumed.kcal)} />
      </Card>

      {/* Today's workout */}
      <Card>
        <View style={styles.workoutHead}>
          <View style={styles.flex}>
            <AppText variant="micro" color="textMuted" style={styles.upper}>
              {workoutDay.weekday}
            </AppText>
            <AppText variant="heading" style={{ marginTop: Spacing.one }}>
              {workoutDay.focus}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
              {workoutDay.target}
            </AppText>
          </View>
          {workoutDay.isLegDay ? <Pill label="Leg day" tone="primary" /> : null}
        </View>
        <KeyValueRow
          label={workoutDay.focus === 'Active recovery' ? 'Activities' : 'Exercises'}
          value={`${workoutDay.exercises.length} | about ${workoutDay.approxMin} min`}
        />
        <AppText
          variant="bodyStrong"
          color="primary"
          style={{ marginTop: Spacing.two }}
          onPress={() => router.navigate({ pathname: '/workout/[dayId]', params: { dayId: workoutDay.id } })}>
          View workout
        </AppText>
      </Card>

      {/* Water */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Water
        </AppText>
        <WaterTracker ml={data.water} onAdd={onAddWater} />
      </Card>

      {/* Movement */}
      <Card>
        <AppText variant="heading">Daily movement</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          Steps are the primary fat-loss lever.
        </AppText>
        <KeyValueRow
          label="Step target"
          value={`${CARDIO_GUIDANCE.stepsTargetMin.toLocaleString('en-US')} - ${CARDIO_GUIDANCE.stepsTargetMax.toLocaleString('en-US')}`}
        />
        <AppText variant="caption" color="primary" onPress={() => router.navigate('/workouts')}>
          See cardio guidance in Workouts
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  weightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.four },
  goalBox: { alignItems: 'flex-end' },
  rings: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.four },
  workoutHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, marginBottom: Spacing.two },
});
