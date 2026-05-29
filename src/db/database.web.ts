/**
 * Web implementation of the persistence layer.
 *
 * expo-sqlite's web build relies on a wasm worker that does not bundle into a
 * static web export, so on web Metro loads this file instead of `database.ts`.
 * It mirrors the exact same API, backed by AsyncStorage (which is localStorage
 * on web), so the deployed web build is fully functional and persistent.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Completion, SetLog, WaterEntry, WeightEntry } from '../types';

const KEYS = {
  weights: 'fittrack.web.weights',
  sets: 'fittrack.web.sets',
  completions: 'fittrack.web.completions',
  water: 'fittrack.web.water',
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function initDatabase(): Promise<void> {
  // No schema to create for the AsyncStorage-backed web store.
}

// --- Weight ----------------------------------------------------------------

export async function upsertWeight(date: string, kg: number): Promise<void> {
  const rows = await readJSON<WeightEntry[]>(KEYS.weights, []);
  const i = rows.findIndex((r) => r.date === date);
  if (i >= 0) rows[i] = { date, kg };
  else rows.push({ date, kg });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  await writeJSON(KEYS.weights, rows);
}

export async function getWeights(): Promise<WeightEntry[]> {
  const rows = await readJSON<WeightEntry[]>(KEYS.weights, []);
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export async function deleteWeight(date: string): Promise<void> {
  const rows = await readJSON<WeightEntry[]>(KEYS.weights, []);
  await writeJSON(KEYS.weights, rows.filter((r) => r.date !== date));
}

// --- Set logs --------------------------------------------------------------

export async function addSet(set: Omit<SetLog, 'id'>): Promise<number> {
  const rows = await readJSON<SetLog[]>(KEYS.sets, []);
  const id = rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;
  rows.push({ ...set, id });
  await writeJSON(KEYS.sets, rows);
  return id;
}

export async function getSets(date: string, exerciseId: string): Promise<SetLog[]> {
  const rows = await readJSON<SetLog[]>(KEYS.sets, []);
  return rows
    .filter((r) => r.date === date && r.exerciseId === exerciseId)
    .sort((a, b) => a.setIndex - b.setIndex);
}

export async function getLatestSession(exerciseId: string): Promise<SetLog[]> {
  const rows = await readJSON<SetLog[]>(KEYS.sets, []);
  const forEx = rows.filter((r) => r.exerciseId === exerciseId);
  if (forEx.length === 0) return [];
  const latest = forEx.reduce((m, r) => (r.date > m ? r.date : m), forEx[0].date);
  return forEx.filter((r) => r.date === latest).sort((a, b) => a.setIndex - b.setIndex);
}

export async function deleteSet(id: number): Promise<void> {
  const rows = await readJSON<SetLog[]>(KEYS.sets, []);
  await writeJSON(KEYS.sets, rows.filter((r) => r.id !== id));
}

// --- Completions -----------------------------------------------------------

const compKey = (date: string, kind: string, refId: string) => `${date}|${kind}|${refId}`;

export async function setCompletion(
  date: string,
  kind: Completion['kind'],
  refId: string,
  done: boolean,
): Promise<void> {
  const map = await readJSON<Record<string, boolean>>(KEYS.completions, {});
  map[compKey(date, kind, refId)] = done;
  await writeJSON(KEYS.completions, map);
}

export async function getCompletions(
  date: string,
  kind: Completion['kind'],
): Promise<Record<string, boolean>> {
  const map = await readJSON<Record<string, boolean>>(KEYS.completions, {});
  const out: Record<string, boolean> = {};
  const prefix = `${date}|${kind}|`;
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}

// --- Water -----------------------------------------------------------------

export async function getWater(date: string): Promise<number> {
  const map = await readJSON<Record<string, number>>(KEYS.water, {});
  return map[date] ?? 0;
}

export async function setWater(date: string, ml: number): Promise<void> {
  const map = await readJSON<Record<string, number>>(KEYS.water, {});
  map[date] = Math.max(0, Math.round(ml));
  await writeJSON(KEYS.water, map);
}

export async function addWater(date: string, deltaMl: number): Promise<number> {
  const current = await getWater(date);
  const next = Math.max(0, current + deltaMl);
  await setWater(date, next);
  return next;
}

// --- Export ----------------------------------------------------------------

export interface DatabaseDump {
  weightEntries: WeightEntry[];
  setLogs: SetLog[];
  completions: Completion[];
  water: WaterEntry[];
}

export async function dumpAll(): Promise<DatabaseDump> {
  const weightEntries = await getWeights();
  const setLogs = await readJSON<SetLog[]>(KEYS.sets, []);
  const compMap = await readJSON<Record<string, boolean>>(KEYS.completions, {});
  const completions: Completion[] = Object.entries(compMap).map(([k, done]) => {
    const [date, kind, refId] = k.split('|');
    return { date, kind: kind as Completion['kind'], refId, done };
  });
  const waterMap = await readJSON<Record<string, number>>(KEYS.water, {});
  const water: WaterEntry[] = Object.entries(waterMap).map(([date, ml]) => ({ date, ml }));
  return { weightEntries, setLogs, completions, water };
}
