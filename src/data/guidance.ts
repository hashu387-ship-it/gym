/**
 * Static in-app guidance copy: the first-launch disclaimer and the guiding
 * principles surfaced around the app. Tone is calm, factual, and encouraging.
 */

import { PROGRESSION_RULE } from '../logic/workoutProgression';

export const DISCLAIMER_TITLE = 'Before you start';

export const DISCLAIMER_BODY = [
  'FitTrack is a personal guide, not medical advice. If you have any health ' +
    'condition, take medication, or are unsure, please consult a doctor before ' +
    'starting this or any diet and training plan.',
  'This plan targets a steady 0.5 to 1 kg of fat loss per week. Losing faster ' +
    'than about 1 kg per week tends to cost muscle and rebound, so the app keeps ' +
    'your deficit in a sustainable range and will not recommend eating below ' +
    '1,500 kcal a day without flagging it.',
  'Progress is judged by your weekly average, not by daily swings on the scale.',
];

export const GUIDING_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: 'Protein first',
    body: 'Aim for roughly 175 to 200 g of protein a day. Protein protects muscle in a deficit and keeps you full.',
  },
  {
    title: 'Progressive overload',
    body: PROGRESSION_RULE,
  },
  {
    title: 'Moderate volume in a deficit',
    body: 'Training volume is kept moderate on purpose. Recovery is lower when calories are down, so quality beats quantity.',
  },
  {
    title: 'Sleep and steps',
    body: 'Seven to eight hours of sleep and a daily step target do more for fat loss than any single workout.',
  },
  {
    title: 'Judge by the weekly average',
    body: 'Weight bounces day to day with water, food, and salt. Watch the weekly average trend, not the daily number.',
  },
];
