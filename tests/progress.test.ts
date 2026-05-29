import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  averageWeeklyChangeKg,
  latestWeight,
  loggingStreak,
  milestones,
  projectedTrend,
  totalChangeKg,
  weeklyAverages,
} from '../src/logic/progress';
import type { WeightEntry } from '../src/types';

const entries: WeightEntry[] = [
  { date: '2026-05-04', kg: 98 },
  { date: '2026-05-05', kg: 97.8 },
  { date: '2026-05-11', kg: 97.2 },
  { date: '2026-05-12', kg: 97.0 },
];

test('latestWeight returns the most recent entry', () => {
  assert.equal(latestWeight(entries)?.date, '2026-05-12');
  assert.equal(latestWeight([]), undefined);
});

test('weekly averages group by ISO week in chronological order', () => {
  const weeks = weeklyAverages(entries);
  assert.equal(weeks.length, 2);
  assert.ok(Math.abs(weeks[0].avgKg - 97.9) < 1e-9);
  assert.ok(Math.abs(weeks[1].avgKg - 97.1) < 1e-9);
  assert.ok(weeks[0].startDate < weeks[1].startDate);
});

test('total and average weekly change reflect loss', () => {
  assert.ok(Math.abs(totalChangeKg(entries) - -1.0) < 1e-9);
  // 1 kg lost over 8 days -> -0.875 kg/week
  assert.ok(Math.abs(averageWeeklyChangeKg(entries) - -0.875) < 1e-9);
});

test('logging streak counts consecutive days ending today or yesterday', () => {
  assert.equal(loggingStreak(['2026-05-27', '2026-05-28', '2026-05-29'], '2026-05-29'), 3);
  // latest is yesterday -> still current
  assert.equal(loggingStreak(['2026-05-28'], '2026-05-29'), 1);
  // a gap breaks the streak
  assert.equal(loggingStreak(['2026-05-25', '2026-05-29'], '2026-05-29'), 1);
  // stale history -> no current streak
  assert.equal(loggingStreak(['2026-05-01'], '2026-05-29'), 0);
  assert.equal(loggingStreak([], '2026-05-29'), 0);
});

test('projected trend declines at the configured weekly rate', () => {
  const pts = projectedTrend(98, '2026-05-01', 0.5, '2026-05-29');
  assert.equal(pts[0].kg, 98);
  // 4 weeks at 0.5 kg/week = 2 kg
  const last = pts[pts.length - 1];
  assert.equal(last.date, '2026-05-29');
  assert.ok(Math.abs(last.kg - 96) < 1e-9);
  for (let i = 1; i < pts.length; i++) {
    assert.ok(pts[i].kg <= pts[i - 1].kg);
  }
});

test('milestones step down to the goal and mark achievement', () => {
  const ms = milestones(98, 85, 94);
  assert.equal(ms[ms.length - 1].label, 'Goal 85 kg');
  // -4 kg milestone (94 kg) is achieved at current 94
  const m4 = ms.find((m) => m.label === '-4 kg');
  assert.ok(m4 && m4.achieved);
  // goal not yet reached
  assert.equal(ms[ms.length - 1].achieved, false);
});
