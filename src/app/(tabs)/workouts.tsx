/**
 * Workouts: the progressive-overload rule, cardio and steps guidance, and the
 * weekly Push/Pull/Legs split. Each day is tappable into its detail screen.
 */

import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { AppText, Card, Pill, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { WORKOUTS, LEG_DAYS } from '@/data/workouts';
import { todayISO } from '@/logic/dates';
import { CARDIO_GUIDANCE, suggestHiitDays } from '@/logic/cardio';
import { PROGRESSION_RULE } from '@/logic/workoutProgression';
import { workoutDayForDate } from '@/logic/selectors';

export default function WorkoutsScreen() {
  const today = todayISO();
  const todayId = workoutDayForDate(today).id;
  const hiitDays = suggestHiitDays(LEG_DAYS, 'Sunday');

  return (
    <Screen title="Workouts" subtitle="6-day Push / Pull / Legs">
      <Card>
        <AppText variant="subheading">Progressive overload</AppText>
        <AppText variant="body" color="textSecondary" style={{ marginTop: Spacing.two }}>
          {PROGRESSION_RULE}
        </AppText>
        <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.three }}>
          Volume is kept moderate on purpose. Recovery is reduced in a deficit, so quality
          beats quantity.
        </AppText>
      </Card>

      <Card>
        <AppText variant="subheading">Cardio and steps</AppText>
        <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
          {CARDIO_GUIDANCE.notes.map((note, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.dot} />
              <AppText variant="body" color="textSecondary" style={styles.flex}>
                {note}
              </AppText>
            </View>
          ))}
        </View>
        <View style={styles.hiitRow}>
          <Pill label={`HIIT: ${hiitDays.join(' & ')}`} tone="primary" />
          <Pill label={`${CARDIO_GUIDANCE.weeklyModerateMinutesTarget}+ min/week`} tone="default" />
        </View>
        <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.two }}>
          HIIT example: {CARDIO_GUIDANCE.hiitExample}. Kept away from leg days.
        </AppText>
      </Card>

      <View>
        <SectionHeader title="Weekly split" caption="Each muscle group is trained twice a week." />
        <View style={{ gap: Spacing.three }}>
          {WORKOUTS.map((day) => (
            <Link
              key={day.id}
              href={{ pathname: '/workout/[dayId]', params: { dayId: day.id } }}
              asChild>
              <Pressable>
                <Card>
                  <View style={styles.dayHead}>
                    <View style={styles.flex}>
                      <View style={styles.dayTitleRow}>
                        <AppText variant="subheading">{day.weekday}</AppText>
                        {day.id === todayId ? <Pill label="Today" tone="success" /> : null}
                        {day.isLegDay ? <Pill label="Legs" tone="primary" /> : null}
                      </View>
                      <AppText variant="bodyStrong" color="primary" style={{ marginTop: Spacing.one }}>
                        {day.focus}
                      </AppText>
                      <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
                        {day.target}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.two }}>
                    {day.exercises.length} {day.focus === 'Active recovery' ? 'activities' : 'exercises'} | about {day.approxMin} min
                  </AppText>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bulletRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#94A3B8', marginTop: 8 },
  hiitRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, flexWrap: 'wrap' },
  dayHead: { flexDirection: 'row', alignItems: 'flex-start' },
  dayTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
});
