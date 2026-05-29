/**
 * Workout day detail: the day's exercises with check-offs, each tappable into
 * its exercise detail screen.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText, Card, Pill } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { formatPrescription, getWorkoutDay } from '@/data/workouts';
import { getCompletions, setCompletion } from '@/db/database';
import { todayISO } from '@/logic/dates';
import { useScreenData } from '@/hooks/use-screen-data';
import { useAppData } from '@/providers/AppDataProvider';
import { useTheme } from '@/hooks/use-theme';
import * as Haptics from 'expo-haptics';

export default function WorkoutDayScreen() {
  const theme = useTheme();
  const { refresh } = useAppData();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const day = getWorkoutDay(dayId);
  const today = todayISO();

  const [done] = useScreenData<Record<string, boolean>>(
    () => getCompletions(today, 'exercise'),
    {},
    [dayId, today],
  );

  if (!day) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Workout' }} />
        <AppText variant="body" color="textSecondary">
          This workout could not be found.
        </AppText>
      </Screen>
    );
  }

  const toggle = (id: string, next: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCompletion(today, 'exercise', id, next).then(refresh).catch(() => {});
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: day.focus }} />

      <Card>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="micro" color="textMuted" style={styles.upper}>
              {day.weekday}
            </AppText>
            <AppText variant="title" style={{ marginTop: Spacing.one }}>
              {day.focus}
            </AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
              {day.target} | about {day.approxMin} min
            </AppText>
          </View>
          {day.isLegDay ? <Pill label="Leg day" tone="primary" /> : null}
        </View>
      </Card>

      <View style={{ gap: Spacing.three }}>
        {day.exercises.map((ex) => (
          <Card key={ex.id} style={styles.exCard}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!done[ex.id] }}
              onPress={() => toggle(ex.id, !done[ex.id])}
              hitSlop={8}
              style={[
                styles.box,
                {
                  borderColor: done[ex.id] ? theme.primary : theme.border,
                  backgroundColor: done[ex.id] ? theme.primary : 'transparent',
                },
              ]}>
              {done[ex.id] ? <Ionicons name="checkmark" size={15} color={theme.onPrimary} /> : null}
            </Pressable>

            <Link href={{ pathname: '/exercise/[exerciseId]', params: { exerciseId: ex.id } }} asChild>
              <Pressable style={styles.exMain}>
                <View style={styles.exTitleRow}>
                  <AppText variant="bodyStrong" color={done[ex.id] ? 'textSecondary' : 'text'} style={{ flex: 1 }}>
                    {ex.name}
                  </AppText>
                  {ex.isWarmup ? <Pill label="Warm-up" tone="default" /> : null}
                </View>
                <AppText variant="caption" color="primary" style={{ marginTop: Spacing.half }}>
                  {formatPrescription(ex)}
                  {ex.restSeconds ? `  ·  rest ${ex.restSeconds}s` : ''}
                </AppText>
                <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.half }} numberOfLines={2}>
                  {ex.formCue}
                </AppText>
              </Pressable>
            </Link>

            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  exCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  box: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exMain: { flex: 1 },
  exTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
