/**
 * Exercise media resolver.
 *
 * Resolves a representative image and a looping demonstration for an exercise
 * from a free, open-licensed source, with a clean placeholder fallback when
 * media is unavailable (offline, blocked, or no match):
 *
 *   1. ExerciseDB (looping GIF) - used only when an API key is provided via the
 *      EXPO_PUBLIC_EXERCISEDB_API_KEY environment variable (see README).
 *   2. wger (static image) - keyless, used as the default attempt.
 *   3. Placeholder - a calm SVG glyph rendered by the ExerciseMedia component.
 *
 * All network calls are wrapped in try/catch with a timeout so a failure never
 * breaks the screen; it simply falls back to the placeholder.
 */

import { useEffect, useRef, useState } from 'react';

import type { Exercise } from '../types';

const EXERCISEDB_KEY = process.env.EXPO_PUBLIC_EXERCISEDB_API_KEY;
const EXERCISEDB_HOST =
  process.env.EXPO_PUBLIC_EXERCISEDB_HOST ?? 'exercisedb.p.rapidapi.com';

const WGER_BASE = 'https://wger.de';
const FETCH_TIMEOUT_MS = 6000;

export type MediaStatus = 'loading' | 'ready' | 'placeholder';

export interface ExerciseMedia {
  status: MediaStatus;
  /** A looping GIF/animation when available. */
  animationUrl: string | null;
  /** A representative still image when available. */
  imageUrl: string | null;
}

/** Simple in-memory cache so revisiting an exercise does not refetch. */
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

/** wger static exercise image by search term. Keyless and open-licensed. */
export async function fetchWgerImage(query: string): Promise<string | null> {
  try {
    const url = `${WGER_BASE}/api/v2/exercise/search/?language=english&format=json&term=${encodeURIComponent(
      query,
    )}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      suggestions?: { data?: { image?: string | null; image_thumbnail?: string | null } }[];
    };
    const hit = data.suggestions?.find((s) => s.data?.image || s.data?.image_thumbnail);
    const path = hit?.data?.image ?? hit?.data?.image_thumbnail ?? null;
    if (!path) return null;
    return path.startsWith('http') ? path : `${WGER_BASE}${path}`;
  } catch {
    return null;
  }
}

/** Resolve media for one exercise, trying the GIF source first, then the image. */
export async function resolveExerciseMedia(exercise: Exercise): Promise<ExerciseMedia> {
  const cached = cache.get(exercise.id);
  if (cached) return cached;

  const [animationUrl, imageUrl] = await Promise.all([
    fetchExerciseDbGif(exercise.mediaQuery),
    fetchWgerImage(exercise.mediaQuery),
  ]);

  const result: ExerciseMedia =
    animationUrl || imageUrl
      ? { status: 'ready', animationUrl, imageUrl }
      : { status: 'placeholder', animationUrl: null, imageUrl: null };

  cache.set(exercise.id, result);
  return result;
}

/**
 * React hook that resolves media for an exercise. Returns `loading` until the
 * lookup settles, then `ready` (with at least one URL) or `placeholder`.
 */
export function useExerciseMedia(exercise: Exercise): ExerciseMedia {
  const [media, setMedia] = useState<ExerciseMedia>(
    () => cache.get(exercise.id) ?? { status: 'loading', animationUrl: null, imageUrl: null },
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
    setMedia({ status: 'loading', animationUrl: null, imageUrl: null });
    resolveExerciseMedia(exercise).then((result) => {
      if (mountedRef.current) setMedia(result);
    });
    return () => {
      mountedRef.current = false;
    };
    // Re-run only when the exercise changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  return media;
}
