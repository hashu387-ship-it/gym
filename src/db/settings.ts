/**
 * Settings persistence via AsyncStorage.
 *
 * The user profile and small app-state flags live here (not in SQLite), since
 * they are a single small blob read once at startup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROFILE } from '../data/profile';
import type { UserProfile } from '../types';

const PROFILE_KEY = 'fittrack.profile.v1';
const APP_STATE_KEY = 'fittrack.appState.v1';

export interface AppState {
  /** Whether the one-time first-launch disclaimer has been acknowledged. */
  disclaimerAccepted: boolean;
}

export const DEFAULT_APP_STATE: AppState = { disclaimerAccepted: false };

export async function loadProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    // Merge over defaults so a newly added field is never undefined.
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadAppState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(APP_STATE_KEY);
    if (!raw) return DEFAULT_APP_STATE;
    return { ...DEFAULT_APP_STATE, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export async function saveAppState(state: AppState): Promise<void> {
  await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}
