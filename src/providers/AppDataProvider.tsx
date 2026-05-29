/**
 * App-wide data context: initialises the database, loads the persisted profile
 * and app-state, and exposes a `revision` counter that screens bump after a
 * write so other screens re-read their data on focus.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_PROFILE } from '@/data/profile';
import { initDatabase } from '@/db/database';
import {
  AppState,
  DEFAULT_APP_STATE,
  loadAppState,
  loadProfile,
  saveAppState,
  saveProfile,
} from '@/db/settings';
import type { UserProfile } from '@/types';

interface AppDataValue {
  /** True once the database is initialised and settings are loaded. */
  ready: boolean;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  appState: AppState;
  acceptDisclaimer: () => Promise<void>;
  /** Increments on every data write so dependent screens can re-query. */
  revision: number;
  refresh: () => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [appState, setAppState] = useState<AppState>(DEFAULT_APP_STATE);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await initDatabase();
      const [p, s] = await Promise.all([loadProfile(), loadAppState()]);
      if (!mounted) return;
      setProfile(p);
      setAppState(s);
      setReady(true);
    })().catch((err) => {
      console.warn('FitTrack init failed', err);
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      const next = { ...profile, ...patch };
      setProfile(next);
      await saveProfile(next);
    },
    [profile],
  );

  const acceptDisclaimer = useCallback(async () => {
    const next = { ...appState, disclaimerAccepted: true };
    setAppState(next);
    await saveAppState(next);
  }, [appState]);

  const refresh = useCallback(() => setRevision((r) => r + 1), []);

  const value = useMemo<AppDataValue>(
    () => ({ ready, profile, updateProfile, appState, acceptDisclaimer, revision, refresh }),
    [ready, profile, updateProfile, appState, acceptDisclaimer, revision, refresh],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
