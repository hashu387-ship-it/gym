/**
 * Exercise detail: representative image / looping demo (with placeholder
 * fallback), the prescription and form cue, a progressive-overload suggestion
 * from the latest session, and per-set logging (weight and reps).
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Screen } from '@/components/Screen';
import { AppText, Card, Divider, Pill } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { formatPrescription, getExercise, WORKOUTS } from '@/data/workouts';
import { addSet, deleteSet, getLatestSession, getSets } from '@/db/database';
import { formatLongDate, todayISO } from '@/logic/dates';
import { evaluateProgression, incrementForExercise } from '@/logic/workoutProgression';
import { useScreenData } from '@/hooks/use-screen-data';
import { useAppData } from '@/providers/AppDataProvider';
import { useTheme } from '@/hooks/use-theme';
import type { SetLog } from '@/types';

interface ExData {
  today: SetLog[];
  last: SetLog[];
}

export default function ExerciseDetailScreen() {
  const theme = useTheme();
  const { refresh } = useAppData();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const exercise = getExercise(exerciseId);
  const today = todayISO();

  const [data] = useScreenData<ExData>(
    async () => ({
      today: await getSets(today, exerciseId),
      last: await getLatestSession(exerciseId),
    }),
    { today: [], last: [] },
    [exerciseId, today],
  );

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  if (!exercise) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Exercise' }} />
        <AppText variant="body" color="textSecondary">
          This exercise could not be found.
        </AppText>
      </Screen>
    );
  }

  const containingDay = WORKOUTS.find((d) => d.exercises.some((e) => e.id === exerciseId));
  const increment = incrementForExercise(containingDay?.isLegDay ?? false);

  const basis = data.today.length > 0 ? data.today : data.last;
  const advice = exercise.repRange
    ? evaluateProgression(
        basis.map((s) => ({ weightKg: s.weightKg, reps: s.reps })),
        exercise.repRange,
        increment,
      )
    : null;

  const addSetHandler = () => {
    const w = parseFloat(weight.replace(',', '.'));
    const r = parseInt(reps, 10);
    if (!Number.isFinite(w) || !Number.isFinite(r) || r <= 0) return;
    addSet({
      date: today,
      exerciseId,
      setIndex: data.today.length + 1,
      weightKg: Math.max(0, w),
      reps: r,
    })
      .then(() => {
        setReps('');
        refresh();
      })
      .catch(() => {});
  };

  const removeSet = (id?: number) => {
    if (id == null) return;
    deleteSet(id).then(refresh).catch(() => {});
  };

  const lastIsPrevious = data.last.length > 0 && data.last[0].date !== today;

  return (
    <Screen>
      <Stack.Screen options={{ title: exercise.name }} />

      <ExerciseMedia exercise={exercise} />

      <Card>
        <View style={styles.titleRow}>
          <AppText variant="title" style={{ flex: 1 }}>
            {exercise.name}
          </AppText>
          {exercise.isWarmup ? <Pill label="Warm-up" tone="default" /> : null}
        </View>
        <AppText variant="bodyStrong" color="primary" style={{ marginTop: Spacing.two }}>
          {formatPrescription(exercise)}
          {exercise.restSeconds ? `  ·  rest ${exercise.restSeconds}s` : ''}
        </AppText>
        <Divider spacing={Spacing.three} />
        <View style={styles.cueRow}>
          <Ionicons name="bulb-outline" size={18} color={theme.amber} style={{ marginTop: 1 }} />
          <AppText variant="body" color="textSecondary" style={{ flex: 1 }}>
            {exercise.formCue}
          </AppText>
        </View>
      </Card>

      {exercise.isWarmup ? (
        <Card>
          <AppText variant="bodyStrong">Warm-up</AppText>
          <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.one }}>
            Ease in at a conversational effort. No load logging needed; just prepare the joints
            and raise your heart rate.
          </AppText>
        </Card>
      ) : (
        <>
          {advice ? (
            <Card>
              <View style={styles.cueRow}>
                <Ionicons
                  name={advice.shouldIncreaseLoad ? 'trending-up' : 'fitness-outline'}
                  size={18}
                  color={advice.shouldIncreaseLoad ? theme.success : theme.primary}
                  style={{ marginTop: 1 }}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">Progression</AppText>
                  <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
                    {advice.message}
                  </AppText>
                </View>
              </View>
            </Card>
          ) : null}

          <Card>
            <AppText variant="heading">Log sets</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
              {formatLongDate(today)} | target {exercise.sets} sets
            </AppText>

            <View style={{ marginTop: Spacing.three, gap: Spacing.one }}>
              {data.today.length === 0 ? (
                <AppText variant="caption" color="textMuted">
                  No sets logged yet today.
                </AppText>
              ) : (
                data.today.map((s, i) => (
                  <View key={s.id ?? i} style={styles.setRow}>
                    <AppText variant="body" color="textSecondary" style={{ width: 56 }}>
                      Set {i + 1}
                    </AppText>
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>
                      {s.weightKg} kg x {s.reps}
                    </AppText>
                    <Pressable onPress={() => removeSet(s.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>

            <View style={styles.inputRow}>
              <View style={styles.field}>
                <AppText variant="micro" color="textMuted" style={styles.upper}>
                  Weight (kg)
                </AppText>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                />
              </View>
              <View style={styles.field}>
                <AppText variant="micro" color="textMuted" style={styles.upper}>
                  Reps
                </AppText>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                />
              </View>
            </View>
            <Button title={`Add set ${data.today.length + 1}`} onPress={addSetHandler} style={{ marginTop: Spacing.three }} />

            {lastIsPrevious ? (
              <>
                <Divider spacing={Spacing.four} />
                <AppText variant="micro" color="textMuted" style={styles.upper}>
                  Last session | {formatLongDate(data.last[0].date)}
                </AppText>
                <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.one }}>
                  {data.last.map((s) => `${s.weightKg}x${s.reps}`).join('   ')}
                </AppText>
              </>
            ) : null}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  cueRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  inputRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  field: { flex: 1, gap: Spacing.one },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    fontSize: 18,
    fontWeight: '600',
  },
});
