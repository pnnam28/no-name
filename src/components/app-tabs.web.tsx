import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { colors as theme_colors, max_content_width, spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused: is_focused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={is_focused ? 'background_selected' : 'background_element'}
        style={styles.tab_button_view}>
        <ThemedText type="small" theme_color={is_focused ? 'text' : 'text_secondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = theme_colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View {...props} style={styles.tab_list_container}>
      <ThemedView type="background_element" style={styles.inner_container}>
        <ThemedText type="small_bold" style={styles.brand_text}>
          Expo Starter
        </ThemedText>

        {props.children}

        <ExternalLink href="https://docs.expo.dev" asChild>
          <Pressable style={styles.external_pressable}>
            <ThemedText type="link">Docs</ThemedText>
            <SymbolView
              tintColor={colors.text}
              name={{ ios: 'arrow.up.right.square', web: 'link' }}
              size={12}
            />
          </Pressable>
        </ExternalLink>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tab_list_container: {
    position: 'absolute',
    width: '100%',
    padding: spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  inner_container: {
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.five,
    borderRadius: spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing.two,
    maxWidth: max_content_width,
  },
  brand_text: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tab_button_view: {
    paddingVertical: spacing.one,
    paddingHorizontal: spacing.three,
    borderRadius: spacing.three,
  },
  external_pressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.one,
    marginLeft: spacing.three,
  },
});
