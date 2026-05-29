/**
 * Loads async data when a screen gains focus and whenever the global data
 * `revision` changes (bumped after any write), so screens stay in sync without
 * a global store.
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useAppData } from '@/providers/AppDataProvider';

export function useScreenData<T>(
  loader: () => Promise<T>,
  initial: T,
  deps: ReadonlyArray<unknown> = [],
): [T, () => void] {
  const { revision } = useAppData();
  const [data, setData] = useState<T>(initial);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(() => {
    loaderRef.current()
      .then(setData)
      .catch((err) => console.warn('Screen data load failed', err));
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, revision, ...deps]),
  );

  return [data, reload];
}
