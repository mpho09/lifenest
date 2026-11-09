import { Tabs } from 'expo-router';
import { Ellipsis, FileText, House, Landmark, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useNotifications, useOpenRequest } from '../../lib/queries';
import { useIsWide } from '../../lib/useLayout';
import { tokens } from '../../theme/tokens';

function TabIcon({ Icon, focused, dot }: { Icon: LucideIcon; focused: boolean; dot?: boolean }) {
  return (
    <View>
      <Icon
        color={focused ? tokens.color.primary : tokens.color.textSecondary}
        fill={focused ? tokens.color.primary : 'none'}
        fillOpacity={focused ? 0.15 : 0}
        size={24}
      />
      {dot ? <View testID="home-dot" accessibilityLabel="New updates" style={styles.dot} /> : null}
    </View>
  );
}

/** Tab bar (Section 7.2, T-C-9): Home, Documents, Assets, People, More. Gold dot on Home (T-C-9b). */
export default function TabLayout() {
  // On wide screens the sidebar replaces the bottom tab bar (Section 18 #34).
  const wide = useIsWide();
  const notifications = useNotifications();
  const open = useOpenRequest();
  const hasAlert =
    (notifications.data ?? []).some((n) => !n.is_read) ||
    (!!open.data && ['submitted', 'verified', 'released'].includes(open.data.status));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.color.primary,
        tabBarInactiveTintColor: tokens.color.textSecondary,
        tabBarLabelStyle: { ...tokens.font.small, fontSize: tokens.font.small.fontSize - 2 },
        tabBarStyle: wide
          ? { display: 'none' }
          : {
              backgroundColor: tokens.color.surface,
              borderTopColor: tokens.color.divider,
              minHeight: tokens.size.touchMin + tokens.space[4],
            },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon Icon={House} focused={focused} dot={hasAlert} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{ title: 'Documents', tabBarIcon: ({ focused }) => <TabIcon Icon={FileText} focused={focused} /> }}
      />
      <Tabs.Screen
        name="assets"
        options={{ title: 'Assets', tabBarIcon: ({ focused }) => <TabIcon Icon={Landmark} focused={focused} /> }}
      />
      <Tabs.Screen
        name="people"
        options={{ title: 'People', tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ focused }) => <TabIcon Icon={Ellipsis} focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -tokens.space[1] / 2,
    right: -tokens.space[1],
    width: tokens.space[2],
    height: tokens.space[2],
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.color.badge,
  },
});
