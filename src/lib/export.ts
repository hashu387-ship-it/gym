/**
 * Export all local data to a single JSON file and offer the OS share sheet.
 *
 * Uses the stable legacy expo-file-system API to write a file into the cache
 * directory, then expo-sharing to hand it off (email, Files, AirDrop, etc.).
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { dumpAll } from '../db/database';
import { loadAppState, loadProfile } from '../db/settings';

export interface ExportResult {
  uri: string;
  shared: boolean;
}

/** Build the export payload, write it to disk, and share it. */
export async function exportDataToJson(): Promise<ExportResult> {
  const [data, profile, appState] = await Promise.all([
    dumpAll(),
    loadProfile(),
    loadAppState(),
  ]);

  const payload = {
    app: 'FitTrack',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile,
    appState,
    data,
  };

  const json = JSON.stringify(payload, null, 2);
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const uri = `${dir}fittrack-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export FitTrack data',
      UTI: 'public.json',
    });
    return { uri, shared: true };
  }

  return { uri, shared: false };
}
