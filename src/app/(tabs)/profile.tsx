/**
 * Profile / Settings: editable stats and plan inputs (with a live target
 * preview), unit and theme preferences, the guiding principles, the safety
 * disclaimer, and the export-to-JSON action.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { SafetyNoteCard } from '@/components/SafetyNoteCard';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { AppText, Card, Divider, KeyValueRow } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { DISCLAIMER_BODY, GUIDING_PRINCIPLES } from '@/data/guidance';
import { getWeights } from '@/db/database';
import { exportDataToJson } from '@/lib/export';
import { formatHeight, formatKcal, formatWeight, roundInt } from '@/logic/format';
import {
  ACTIVITY_LABELS,
  DEFICIT_MAX,
  DEFICIT_MIN,
  PROTEIN_PER_KG_MAX,
  PROTEIN_PER_KG_MIN,
  computeNutritionTargets,
  targetFloorNotes,
} from '@/logic/nutrition';
import { currentWeightKg } from '@/logic/selectors';
import { useScreenData } from '@/hooks/use-screen-data';
import { useAppData } from '@/providers/AppDataProvider';
import { useTheme } from '@/hooks/use-theme';
import type { ActivityLevel, WeightEntry } from '@/types';

export default function ProfileScreen() {
  const { profile, updateProfile } = useAppData();
  const theme = useTheme();
  const units = profile.units;

  const [weights] = useScreenData<WeightEntry[]>(() => getWeights(), []);
  const weightNow = currentWeightKg(profile, weights);
  const targets = computeNutritionTargets(profile, weightNow);
  const floorNotes = targetFloorNotes(targets);

  const onExport = async () => {
    try {
      const result = await exportDataToJson();
      if (!result.shared) {
        Alert.alert('Export ready', `Your data was saved to:\n${result.uri}`);
      }
    } catch {
      Alert.alert('Export failed', 'Your data could not be exported. Please try again.');
    }
  };

  return (
    <Screen title="Profile">
      {/* Live target preview */}
      <Card>
        <AppText variant="heading">Your targets</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
          Recalculated from your details and current weight ({formatWeight(weightNow, units)}).
        </AppText>
        <View style={{ marginTop: Spacing.three }}>
          <KeyValueRow label="BMR (Mifflin-St Jeor)" value={`${roundInt(targets.bmr)} kcal`} />
          <KeyValueRow label={`Maintenance (x${targets.activityMultiplier})`} value={`${roundInt(targets.tdee)} kcal`} />
          <KeyValueRow label="Daily target" value={formatKcal(targets.recommendedCalories)} valueColor="primary" />
          <Divider spacing={Spacing.two} />
          <KeyValueRow label="Protein" value={`${roundInt(targets.proteinG)} g`} valueColor="protein" />
          <KeyValueRow label="Carbohydrate" value={`${roundInt(targets.carbsG)} g`} valueColor="carbs" />
          <KeyValueRow label="Fat" value={`${roundInt(targets.fatG)} g`} valueColor="fat" />
          <Divider spacing={Spacing.two} />
          <KeyValueRow label="Projected loss" value={`~${targets.estimatedWeeklyLossKg.toFixed(2)} kg/week`} />
        </View>
        {floorNotes.length > 0 ? (
          <View style={{ marginTop: Spacing.three }}>
            <SafetyNoteCard note={floorNotes[0]} />
          </View>
        ) : null}
      </Card>

      {/* Details */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Your details
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
          Sex
        </AppText>
        <Segmented
          value={profile.sex}
          onChange={(sex) => updateProfile({ sex })}
          options={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ]}
        />
        <View style={{ height: Spacing.three }} />
        <Stepper label="Age" value={profile.age} min={16} max={90} step={1} onChange={(age) => updateProfile({ age })} format={(v) => `${v} yr`} />
        <Stepper label="Height" value={profile.heightCm} min={130} max={210} step={1} onChange={(heightCm) => updateProfile({ heightCm })} format={(v) => formatHeight(v, units)} />
        <Stepper label="Start weight" value={profile.startWeightKg} min={40} max={250} step={0.5} onChange={(startWeightKg) => updateProfile({ startWeightKg })} format={(v) => formatWeight(v, units)} />
        <Stepper label="Goal weight" value={profile.goalWeightKg} min={40} max={profile.startWeightKg} step={0.5} onChange={(goalWeightKg) => updateProfile({ goalWeightKg })} format={(v) => formatWeight(v, units)} />
      </Card>

      {/* Plan */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Your plan
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
          Activity level
        </AppText>
        <View style={{ gap: Spacing.one }}>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => {
            const selected = profile.activityLevel === level;
            return (
              <Pressable
                key={level}
                onPress={() => updateProfile({ activityLevel: level })}
                style={[styles.radioRow, { borderColor: selected ? theme.primary : theme.border }]}>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selected ? theme.primary : theme.textMuted}
                />
                <AppText variant="body" color={selected ? 'text' : 'textSecondary'} style={{ flex: 1 }}>
                  {ACTIVITY_LABELS[level]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: Spacing.three }} />
        <Stepper
          label="Daily deficit"
          value={profile.deficitKcal}
          min={DEFICIT_MIN}
          max={DEFICIT_MAX}
          step={50}
          onChange={(deficitKcal) => updateProfile({ deficitKcal })}
          format={(v) => `${v} kcal`}
        />
        <Stepper
          label="Protein"
          value={profile.proteinPerKg}
          min={PROTEIN_PER_KG_MIN}
          max={PROTEIN_PER_KG_MAX}
          step={0.1}
          onChange={(proteinPerKg) => updateProfile({ proteinPerKg })}
          format={(v) => `${v.toFixed(1)} g/kg`}
        />
        <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.two }}>
          The deficit is capped at the sustainable 500-750 kcal range, so FitTrack cannot set a crash diet.
        </AppText>
      </Card>

      {/* Preferences */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.three }}>
          Preferences
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
          Units
        </AppText>
        <Segmented
          value={profile.units}
          onChange={(units2) => updateProfile({ units: units2 })}
          options={[
            { label: 'Metric (kg)', value: 'metric' },
            { label: 'Imperial (lb)', value: 'imperial' },
          ]}
        />
        <View style={{ height: Spacing.three }} />
        <AppText variant="caption" color="textSecondary" style={styles.fieldLabel}>
          Theme
        </AppText>
        <Segmented
          value={profile.themePreference}
          onChange={(themePreference) => updateProfile({ themePreference })}
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </Card>

      {/* Guiding principles */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.two }}>
          Guiding principles
        </AppText>
        {GUIDING_PRINCIPLES.map((p, i) => (
          <View key={i} style={{ marginTop: i === 0 ? 0 : Spacing.three }}>
            <AppText variant="bodyStrong">{p.title}</AppText>
            <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half }}>
              {p.body}
            </AppText>
          </View>
        ))}
      </Card>

      {/* Safety */}
      <Card>
        <AppText variant="heading" style={{ marginBottom: Spacing.two }}>
          Safety
        </AppText>
        {DISCLAIMER_BODY.map((para, i) => (
          <AppText key={i} variant="caption" color="textSecondary" style={{ marginTop: i === 0 ? 0 : Spacing.two }}>
            {para}
          </AppText>
        ))}
      </Card>

      {/* Data */}
      <Card>
        <AppText variant="heading">Your data</AppText>
        <AppText variant="caption" color="textSecondary" style={{ marginTop: Spacing.half, marginBottom: Spacing.three }}>
          Everything is stored only on this device. Export a full JSON backup at any time.
        </AppText>
        <Button title="Export data to JSON" variant="secondary" onPress={onExport} />
      </Card>

      <AppText variant="micro" color="textMuted" style={styles.footer}>
        FitTrack | Single-user, offline-first
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
  },
  footer: { textAlign: 'center', marginTop: Spacing.two },
});
