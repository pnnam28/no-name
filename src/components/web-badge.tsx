import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { spacing } from '@/constants/theme';

export function WebBadge() {
  const scheme = useColorScheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="code" theme_color="text_secondary" style={styles.version_text}>
        v{version}
      </ThemedText>
      <Image
        source={
          scheme === 'dark'
            ? require('@/assets/images/expo-badge-white.png')
            : require('@/assets/images/expo-badge.png')
        }
        style={styles.badge_image}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.five,
    alignItems: 'center',
    gap: spacing.two,
  },
  version_text: {
    textAlign: 'center',
  },
  badge_image: {
    width: 123,
    aspectRatio: 123 / 24,
  },
});
