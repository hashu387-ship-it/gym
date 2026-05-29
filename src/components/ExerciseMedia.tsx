/**
 * Shows an exercise's looping demonstration (or still image) resolved from a
 * free media source, with a clean placeholder while loading or when media is
 * unavailable. A failed image load also falls back to the placeholder.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExerciseMedia } from '@/lib/media';
import type { Exercise } from '@/types';

export function ExerciseMedia({ exercise, height = 210 }: { exercise: Exercise; height?: number }) {
  const theme = useTheme();
  const media = useExerciseMedia(exercise);
  const [failed, setFailed] = useState(false);

  // Reset the failed flag when the exercise changes.
  useEffect(() => setFailed(false), [exercise.id]);

  const uri = media.animationUrl ?? media.imageUrl;
  const showImage = !!uri && !failed;
  const loading = media.status === 'loading' && !uri;

  return (
    <View style={[styles.box, { height, backgroundColor: theme.backgroundElement }]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
          onError={() => setFailed(true)}
          accessibilityLabel={`${exercise.name} demonstration`}
        />
      ) : (
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator color={theme.textMuted} />
          ) : (
            <Ionicons name="barbell-outline" size={40} color={theme.textMuted} />
          )}
          <AppText variant="caption" color="textMuted" style={{ marginTop: Spacing.two }}>
            {loading ? 'Loading demonstration' : 'Demonstration unavailable'}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
