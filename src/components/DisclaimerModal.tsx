/**
 * One-time, first-launch disclaimer. Shown until acknowledged; not dismissable
 * by tapping outside so it is read once before use.
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { DISCLAIMER_BODY, DISCLAIMER_TITLE } from '@/data/guidance';
import { useTheme } from '@/hooks/use-theme';

export function DisclaimerModal({ visible, onAccept }: { visible: boolean; onAccept: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.card, marginBottom: insets.bottom + Spacing.four },
          ]}>
          <AppText variant="title">{DISCLAIMER_TITLE}</AppText>
          <ScrollView style={styles.scroll} contentContainerStyle={{ gap: Spacing.three }}>
            {DISCLAIMER_BODY.map((para, i) => (
              <AppText key={i} variant="body" color="textSecondary">
                {para}
              </AppText>
            ))}
          </ScrollView>
          <Button title="I understand" onPress={onAccept} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', padding: Spacing.four },
  sheet: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
    maxHeight: '80%',
  },
  scroll: { flexGrow: 0 },
});
