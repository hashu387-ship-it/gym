/**
 * Local persistence via expo-sqlite.
 *
 * Stores everything the charts and history read from: weight entries, per-set
 * workout logs, meal/workout check-offs, and daily water intake. A single
 * synchronous database handle is opened lazily and shared across the app.
 */

import * as SQLite from 'expo-sqlite';

import type { Completion, SetLog, WaterEntry, WeightEntry } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/** Open (once) and return the shared database handle. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) dbInstance = SQLite.openDatabaseSync('fittrack.db');
  return dbInstance;
}

/** Create tables and indexes if they do not yet exist. Safe to call repeatedly. */
export async function initDatabase(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS weight_entries (
      date TEXT PRIMARY KEY NOT NULL,
      kg REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS set_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_index INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completions (
      date TEXT NOT NULL,
      kind TEXT NOT NULL,
      ref_id TEXT NOT NULL,
      done INTEGER NOT NULL,
      PRIMARY KEY (date, kind, ref_id)
    );
    CREATE TABLE IF NOT EXISTS water (
      date TEXT PRIMARY KEY NOT NULL,
      ml INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_setlogs_ex_date ON set_logs (exercise_id, date);
  `);
}

// --- Weight ----------------------------------------------------------------

/** Insert or replace the weight for a day (one entry per calendar day). */
export async function upsertWeight(date: string, kg: number): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO weight_entries (date, kg) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET kg = excluded.kg`,
    date,
    kg,
  );
}

export async function getWeights(): Promise<WeightEntry[]> {
  const rows = await getDb().getAllAsync<{ date: string; kg: number }>(
    `SELECT date, kg FROM weight_entries ORDER BY date ASC`,
  );
  return rows.map((r) => ({ date: r.date, kg: r.kg }));
}

export async function deleteWeight(date: string): Promise<void> {
  await getDb().runAsync(`DELETE FROM weight_entries WHERE date = ?`, date);
}

// --- Set logs --------------------------------------------------------------

export async function addSet(set: Omit<SetLog, 'id'>): Promise<number> {
  const r = await getDb().runAsync(
    `INSERT INTO set_logs (date, exercise_id, set_index, weight_kg, reps)
     VALUES (?, ?, ?, ?, ?)`,
    set.date,
    set.exerciseId,
    set.setIndex,
    set.weightKg,
    set.reps,
  );
  return r.lastInsertRowId;
}

export async function getSets(date: string, exerciseId: string): Promise<SetLog[]> {
  const rows = await getDb().getAllAsync<{
    id: number;
    date: string;
    exercise_id: string;
    set_index: number;
    weight_kg: number;
    reps: number;
  }>(
    `SELECT * FROM set_logs WHERE date = ? AND exercise_id = ? ORDER BY set_index ASC`,
    date,
    exerciseId,
  );
  return rows.map(rowToSet);
}

/** The most recent session's sets for an exercise (used for progression advice). */
export async function getLatestSession(exerciseId: string): Promise<SetLog[]> {
  const latest = await getDb().getFirstAsync<{ date: string }>(
    `SELECT date FROM set_logs WHERE exercise_id = ? ORDER BY date DESC LIMIT 1`,
    exerciseId,
  );
  if (!latest) return [];
  return getSets(latest.date, exerciseId);
}

export async function deleteSet(id: number): Promise<void> {
  await getDb().runAsync(`DELETE FROM set_logs WHERE id = ?`, id);
}

function rowToSet(r: {
  id: number;
  date: string;
  exercise_id: string;
  set_index: number;
  weight_kg: number;
  reps: number;
}): SetLog {
  return {
    id: r.id,
    date: r.date,
    exerciseId: r.exercise_id,
    setIndex: r.set_index,
    weightKg: r.weight_kg,
    reps: r.reps,
  };
}

// --- Completions (meal + workout check-offs) -------------------------------

export async function setCompletion(
  date: string,
  kind: Completion['kind'],
  refId: string,
  done: boolean,
): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO completions (date, kind, ref_id, done) VALUES (?, ?, ?, ?)
     ON CONFLICT(date, kind, ref_id) DO UPDATE SET done = excluded.done`,
    date,
    kind,
    refId,
    done ? 1 : 0,
  );
}

/** Map of refId -> done for a given day and kind. */
export async function getCompletions(
  date: string,
  kind: Completion['kind'],
): Promise<Record<string, boolean>> {
  const rows = await getDb().getAllAsync<{ ref_id: string; done: number }>(
    `SELECT ref_id, done FROM completions WHERE date = ? AND kind = ?`,
    date,
    kind,
  );
  const map: Record<string, boolean> = {};
  for (const r of rows) map[r.ref_id] = r.done === 1;
  return map;
}

// --- Water -----------------------------------------------------------------

export async function getWater(date: string): Promise<number> {
  const row = await getDb().getFirstAsync<{ ml: number }>(
    `SELECT ml FROM water WHERE date = ?`,
    date,
  );
  return row?.ml ?? 0;
}

export async function setWater(date: string, ml: number): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO water (date, ml) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET ml = excluded.ml`,
    date,
    Math.max(0, Math.round(ml)),
  );
}

/** Adjust today's water by a delta (clamped at zero) and return the new total. */
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

/** Read every row from every table, for the JSON export. */
export async function dumpAll(): Promise<DatabaseDump> {
  const db = getDb();
  const weightEntries = await getWeights();
  const setRows = await db.getAllAsync<{
    id: number;
    date: string;
    exercise_id: string;
    set_index: number;
    weight_kg: number;
    reps: number;
  }>(`SELECT * FROM set_logs ORDER BY date ASC, exercise_id ASC, set_index ASC`);
  const completionRows = await db.getAllAsync<{
    date: string;
    kind: string;
    ref_id: string;
    done: number;
  }>(`SELECT * FROM completions ORDER BY date ASC`);
  const waterRows = await db.getAllAsync<{ date: string; ml: number }>(
    `SELECT * FROM water ORDER BY date ASC`,
  );
  return {
    weightEntries,
    setLogs: setRows.map(rowToSet),
    completions: completionRows.map((r) => ({
      date: r.date,
      kind: r.kind as Completion['kind'],
      refId: r.ref_id,
      done: r.done === 1,
    })),
    water: waterRows.map((r) => ({ date: r.date, ml: r.ml })),
  };
}
