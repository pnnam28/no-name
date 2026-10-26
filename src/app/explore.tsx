import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { bottom_tab_inset, max_content_width, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const safe_area_insets = useSafeAreaInsets();
  const insets = {
    ...safe_area_insets,
    bottom: safe_area_insets.bottom + bottom_tab_inset + spacing.three,
  };
  const theme = useTheme();

  const content_platform_style = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: spacing.six,
      paddingBottom: spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scroll_view, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.content_container, content_platform_style]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.title_container}>
          <ThemedText type="subtitle">Explore</ThemedText>
          <ThemedText style={styles.center_text} theme_color="text_secondary">
            This starter app includes example{'\n'}code to help you get started.
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="background_element" style={styles.link_button}>
                <ThemedText type="link">Expo documentation</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sections_wrapper}>
          <Collapsible title="File-based routing">
            <ThemedText type="small">
              This app has two screens: <ThemedText type="code">src/app/index.tsx</ThemedText> and{' '}
              <ThemedText type="code">src/app/explore.tsx</ThemedText>
            </ThemedText>
            <ThemedText type="small">
              The layout file in <ThemedText type="code">src/app/_layout.tsx</ThemedText> sets up
              the tab navigator.
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="link_primary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <ThemedView type="background_element" style={styles.collapsible_content}>
              <ThemedText type="small">
                You can open this project on Android, iOS, and the web. To open the web version,
                press <ThemedText type="small_bold">w</ThemedText> in the terminal running this
                project.
              </ThemedText>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={styles.image_tutorial}
              />
            </ThemedView>
          </Collapsible>

          <Collapsible title="Images">
            <ThemedText type="small">
              For static images, you can use the <ThemedText type="code">@2x</ThemedText> and{' '}
              <ThemedText type="code">@3x</ThemedText> suffixes to provide files for different
              screen densities.
            </ThemedText>
            <Image source={require('@/assets/images/react-logo.png')} style={styles.image_react} />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="link_primary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Light and dark mode components">
            <ThemedText type="small">
              This template has light and dark mode support. The{' '}
              <ThemedText type="code">useColorScheme()</ThemedText> hook lets you inspect what the
              user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <ThemedText type="link_primary">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Animations">
            <ThemedText type="small">
              This template includes an example of an animated component. The{' '}
              <ThemedText type="code">src/components/ui/collapsible.tsx</ThemedText> component uses
              the powerful <ThemedText type="code">react-native-reanimated</ThemedText> library to
              animate opening this hint.
            </ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll_view: {
    flex: 1,
  },
  content_container: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: max_content_width,
    flexGrow: 1,
  },
  title_container: {
    gap: spacing.three,
    alignItems: 'center',
    paddingHorizontal: spacing.four,
    paddingVertical: spacing.six,
  },
  center_text: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  link_button: {
    flexDirection: 'row',
    paddingHorizontal: spacing.four,
    paddingVertical: spacing.two,
    borderRadius: spacing.five,
    justifyContent: 'center',
    gap: spacing.one,
    alignItems: 'center',
  },
  sections_wrapper: {
    gap: spacing.five,
    paddingHorizontal: spacing.four,
    paddingTop: spacing.three,
  },
  collapsible_content: {
    alignItems: 'center',
  },
  image_tutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: spacing.three,
    marginTop: spacing.two,
  },
  image_react: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
