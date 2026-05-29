/**
 * Nutrition: the halal plan for a selected day with animated macro rings, the
 * water tracker, per-item check-offs (for today), and macro-equivalent swaps.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CheckRow } from '@/components/CheckRow';
import { RingStat } from '@/components/MacroRing';
import { Screen } from '@/components/Screen';
import { WaterTracker } from '@/components/WaterTracker';
import { AppText, Card, Divider, Pill } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { DIET_NOTES } from '@/data/profile';
import {
  computeItem,
  dayTotals,
  MEAL_PLAN,
  MEAL_SLOT_LABELS,
  mealTotals,
} from '@/data/mealPlan';
import { addWater, getCompletions, getWater, getWeights, setCompletion } from '@/db/database';
import { todayISO } from '@/logic/dates';
import { formatKcal, roundInt } from '@/logic/format';
import { computeNutritionTargets } from '@/logic/nutrition';
import { currentWeightKg, cycleIndexForDate } from '@/logic/selectors';
import { useScreenData } from '@/hooks/use-screen-data';
import { useAppData } from '@/providers/AppDataProvider';
import type { WeightEntry } from '@/types';

interface NutritionData {
  mealDone: Record<string, boolean>;
  water: number;
  weights: WeightEntry[];
}

const macroLine = (kcal: number, p: number, c: number, f: number) =>
  `${roundInt(kcal)} kcal  ·  ${roundInt(p)}P  ·  ${roundInt(c)}C  ·  ${roundInt(f)}F`;

export default function NutritionScreen() {
  const { profile, refresh } = useAppData();
  const today = todayISO();
  const todayIndex = cycleIndexForDate(today);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);

  const [data] = useScreenData<NutritionData>(
    async () => ({
      mealDone: await getCompletions(today, 'meal'),
      water: await getWater(today),
      weights: await getWeights(),
    }),
    { mealDone: {}, water: 0, weights: [] },
    [today],
  );

  const day = MEAL_PLAN[selectedIndex];
  const isToday = selectedIndex === todayIndex;
  const targets = computeNutritionTargets(profile, currentWeightKg(profile, data.weights));
  const totals = dayTotals(day);

  const toggle = (id: string, next: boolean) => {
    setCompletion(today, 'meal', id, next).then(refresh).catch(() => {});
  };

  const onAddWater = (delta: number) => {
    addWater(today, delta).then(refresh).catch(() => {});
  };

  return (
    <Screen title="Nutrition" subtitle="Halal plan">
      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daySelector}>
        {MEAL_PLAN.map((d, i) => (
          <DayChip
            key={d.index}
            label={d.title}
            today={i === todayIndex}
            selected={i === selectedIndex}
            onPress={() => setSelectedIndex(i)}
          />
        ))}
      </ScrollView>

      {/* Macro rings for the day's plan */}
      <Card>
        <AppText variant="heading">{day.title} targets</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          This day provides {formatKcal(totals.kcal)} against a {roundInt(targets.recommendedCalories)} kcal target.
        </AppText>
        <View style={styles.rings}>
          <RingStat label="Calories" value={String(roundInt(totals.kcal))} sub={`/ ${roundInt(targets.recommendedCalories)}`} progress={totals.kcal / targets.recommendedCalories} colorKey="primary" size={92} />
          <RingStat label="Protein" value={`${roundInt(totals.proteinG)}g`} progress={totals.proteinG / targets.proteinG} colorKey="protein" size={92} />
          <RingStat label="Carbs" value={`${roundInt(totals.carbsG)}g`} progress={totals.carbsG / targets.carbsG} colorKey="carbs" size={92} />
          <RingStat label="Fat" value={`${roundInt(totals.fatG)}g`} progress={totals.fatG / targets.fatG} colorKey="fat" size={92} />
        </View>
        <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.three }}>
          Protein comes first; fat is about a quarter of calories; carbohydrates fill the rest and
          are weighted around training for energy and recovery.
        </AppText>
      </Card>

      {/* Diet note */}
      <Card>
        <View style={styles.noteHead}>
          <Ionicons name="leaf-outline" size={18} color="#15803D" />
          <AppText variant="bodyStrong">Halal, Gulf-region staples</AppText>
        </View>
        {DIET_NOTES.map((n, i) => (
          <AppText key={i} variant="caption" color="textSecondary" style={{ marginTop: Spacing.one }}>
            {n}
          </AppText>
        ))}
      </Card>

      {/* Water */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Water
        </AppText>
        <WaterTracker ml={data.water} onAdd={onAddWater} />
      </Card>

      {!isToday ? (
        <View style={[styles.hint, { borderColor: '#FCD34D' }]}>
          <AppText variant="caption" color="textSecondary">
            Previewing {day.title}. Switch to today's day to check items off.
          </AppText>
        </View>
      ) : null}

      {/* Meals */}
      {day.meals.map((meal) => {
        const mt = mealTotals(meal);
        return (
          <Card key={meal.slot}>
            <View style={styles.mealHead}>
              <View style={{ flex: 1 }}>
                <AppText variant="micro" color="textMuted" style={styles.upper}>
                  {MEAL_SLOT_LABELS[meal.slot]}
                </AppText>
                <AppText variant="subheading" style={{ marginTop: Spacing.half }}>
                  {meal.title}
                </AppText>
              </View>
              <Pill label={formatKcal(mt.kcal)} tone="default" />
            </View>

            <View style={{ marginTop: Spacing.two }}>
              {meal.items.map((item) => {
                const c = computeItem(item);
                const subtitle = `${item.householdMeasure}  ·  ${macroLine(c.kcal, c.proteinG, c.carbsG, c.fatG)}`;
                if (isToday) {
                  return (
                    <CheckRow
                      key={item.id}
                      done={!!data.mealDone[item.id]}
                      onToggle={(next) => toggle(item.id, next)}
                      title={c.name}
                      subtitle={subtitle}
                    />
                  );
                }
                return (
                  <View key={item.id} style={styles.previewRow}>
                    <AppText variant="bodyStrong">{c.name}</AppText>
                    <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.half }}>
                      {subtitle}
                    </AppText>
                  </View>
                );
              })}
            </View>

            <Divider spacing={Spacing.three} />
            <View style={styles.swaps}>
              {meal.swaps.map((swap, i) => (
                <View key={i} style={styles.swapRow}>
                  <Ionicons name="swap-horizontal" size={15} color="#0E7490" style={{ marginTop: 2 }} />
                  <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>
                    {swap}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function DayChip({
  label,
  selected,
  today,
  onPress,
}: {
  label: string;
  selected: boolean;
  today: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}>
        <AppText variant="caption" color={selected ? 'onPrimary' : 'textSecondary'}>
          {label}
          {today ? ' (today)' : ''}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  daySelector: { gap: Spacing.two, paddingVertical: Spacing.one, paddingRight: Spacing.four },
  chip: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  chipSelected: { backgroundColor: '#0E7490' },
  chipIdle: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: '#94A3B8' },
  rings: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mealHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  upper: { textTransform: 'uppercase', letterSpacing: 0.5 },
  previewRow: { paddingVertical: Spacing.two },
  swaps: { gap: Spacing.two },
  swapRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  hint: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three },
});
