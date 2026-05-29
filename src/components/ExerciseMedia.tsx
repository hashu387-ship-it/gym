/**
 * Shows an exercise's demonstration. By default this is an on-device looping
 * SVG animation (no setup required). If an ExerciseDB API key is configured and
 * returns a GIF, that real demonstration is shown instead; a failed image load
 * falls back to the animation.
 */

import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { Radius } from '@/constants/theme';
import { getExercisePattern } from '@/data/exercisePatterns';
import { useTheme } from '@/hooks/use-theme';
import { useExerciseMedia } from '@/lib/media';
import type { Exercise } from '@/types';

export function ExerciseMedia({ exercise, height = 210 }: { exercise: Exercise; height?: number }) {
  const theme = useTheme();
  const media = useExerciseMedia(exercise);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [exercise.id]);

  const uri = media.animationUrl ?? media.imageUrl;
  const showImage = !!uri && !failed;

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
        <View style={StyleSheet.absoluteFill}>
          <ExerciseAnimation pattern={getExercisePattern(exercise.id)} />
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
});
