/**
 * Default profile for the single user, per the brief. Every field is editable
 * in Settings; these are only the first-run defaults.
 */

import type { UserProfile } from '../types';

export const DEFAULT_PROFILE: UserProfile = {
  sex: 'male',
  age: 32,
  heightCm: 165,
  startWeightKg: 98,
  // A self-selected first goal (clearly editable in Settings). Chosen as a
  // sustainable, non-clinical target roughly 13 kg below the start.
  goalWeightKg: 85,
  activityLevel: 'moderate', // multiplier 1.55
  deficitKcal: 600, // within the sustainable 500-750 band -> ~0.55 kg/week
  proteinPerKg: 2.0, // ~196 g/day at 98 kg (the "protein first" guidance)
  units: 'metric',
  themePreference: 'system',
};

/** Halal dietary constraints, surfaced in Settings and the meal plan header. */
export const DIET_NOTES = [
  'All meals are halal: no pork, no alcohol, no non-halal gelatin.',
  'Built around affordable Gulf-region staples.',
];
