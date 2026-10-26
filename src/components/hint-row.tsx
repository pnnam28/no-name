import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { spacing } from '@/constants/theme';

type HintRowProps = {
  title?: string;
  hint?: ReactNode;
};

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View style={styles.step_row}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="background_selected" style={styles.code_snippet}>
        <ThemedText theme_color="text_secondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  step_row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  code_snippet: {
    borderRadius: spacing.two,
    paddingVertical: spacing.half,
    paddingHorizontal: spacing.two,
  },
});
