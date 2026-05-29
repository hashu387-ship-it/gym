/**
 * Optional real-media resolver for exercises.
 *
 * By default FitTrack shows on-device SVG animations (see ExerciseAnimation),
 * which need no configuration. If an ExerciseDB (RapidAPI) key is provided via
 * EXPO_PUBLIC_EXERCISEDB_API_KEY, a real looping GIF is fetched and shown
 * instead. Without a key, no network request is made and the animation is used.
 */

import { useEffect, useRef, useState } from 'react';

import type { Exercise } from '../types';

const EXERCISEDB_KEY = process.env.EXPO_PUBLIC_EXERCISEDB_API_KEY;
const EXERCISEDB_HOST =
  process.env.EXPO_PUBLIC_EXERCISEDB_HOST ?? 'exercisedb.p.rapidapi.com';
const FETCH_TIMEOUT_MS = 6000;

export type MediaStatus = 'loading' | 'ready' | 'none';

export interface ExerciseMedia {
  status: MediaStatus;
  /** A looping GIF/animation when available. */
  animationUrl: string | null;
  /** A representative still image when available. */
  imageUrl: string | null;
}

const NONE: ExerciseMedia = { status: 'none', animationUrl: null, imageUrl: null };
const cache = new Map<string, ExerciseMedia>();

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** ExerciseDB looping GIF by exercise name. Returns null without an API key. */
export async function fetchExerciseDbGif(query: string): Promise<string | null> {
  if (!EXERCISEDB_KEY) return null;
  try {
    const url = `https://${EXERCISEDB_HOST}/exercises/name/${encodeURIComponent(
      query.toLowerCase(),
    )}?limit=1`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'X-RapidAPI-Key': EXERCISEDB_KEY,
        'X-RapidAPI-Host': EXERCISEDB_HOST,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { gifUrl?: string }[];
    return data?.[0]?.gifUrl ?? null;
  } catch {
    return null;
  }
}

/** Resolve optional real media for an exercise (GIF if an API key is set). */
export async function resolveExerciseMedia(exercise: Exercise): Promise<ExerciseMedia> {
  const cached = cache.get(exercise.id);
  if (cached) return cached;
  if (!EXERCISEDB_KEY) {
    cache.set(exercise.id, NONE);
    return NONE;
  }
  const animationUrl = await fetchExerciseDbGif(exercise.mediaQuery);
  const result: ExerciseMedia = animationUrl
    ? { status: 'ready', animationUrl, imageUrl: null }
    : NONE;
  cache.set(exercise.id, result);
  return result;
}

/**
 * React hook returning optional real media for an exercise. Resolves to `none`
 * immediately when no API key is configured (the animation is then used).
 */
export function useExerciseMedia(exercise: Exercise): ExerciseMedia {
  const [media, setMedia] = useState<ExerciseMedia>(
    () => cache.get(exercise.id) ?? (EXERCISEDB_KEY ? { status: 'loading', animationUrl: null, imageUrl: null } : NONE),
  );
  const exerciseId = exercise.id;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const existing = cache.get(exerciseId);
    if (existing) {
      setMedia(existing);
      return;
    }
    if (!EXERCISEDB_KEY) {
      setMedia(NONE);
      return;
    }
    setMedia({ status: 'loading', animationUrl: null, imageUrl: null });
    resolveExerciseMedia(exercise).then((result) => {
      if (mountedRef.current) setMedia(result);
    });
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  return media;
}
