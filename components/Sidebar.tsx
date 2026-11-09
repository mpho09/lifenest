import { router, usePathname } from 'expo-router';
import {
  Ellipsis,
  FilePen,
  FileText,
  HeartPulse,
  House,
  Landmark,
  Lock,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { labels } from '../lib/messages';
import { useNotifications, useOpenRequest, useProfile } from '../lib/queries';
import { useSession } from '../lib/session';
import { tokens } from '../theme/tokens';
import { Logo } from './Logo';

/** React Native Web adds `hovered` to the Pressable state; native types do not include it. */
const isHovered = (state: object) => !!(state as { hovered?: boolean }).hovered;

type Item = { href: string; label: string; icon: LucideIcon; match: (path: string) => boolean };

const ITEMS: Item[] = [
  { href: '/', label: 'Home', icon: House, match: (p) => p === '/' },
  { href: '/documents', label: 'Documents', icon: FileText, match: (p) => p.startsWith('/document') },
  { href: '/assets', label: 'Assets', icon: Landmark, match: (p) => p.startsWith('/asset') },
  {
    href: '/people',
    label: 'People',
    icon: Users,
    match: (p) => p.startsWith('/people') || p.startsWith('/contact') || p.startsWith('/shared'),
  },
  {
    href: '/instructions',
    label: labels.instructionsAndMessages,
    icon: FilePen,
    match: (p) => p.startsWith('/instructions'),
  },
  {
    href: '/emergency-profile',
    label: labels.emergencyProfile,
    icon: HeartPulse,
    match: (p) => p.startsWith('/emergency'),
  },
  { href: '/more', label: 'More', icon: Ellipsis, match: (p) => p.startsWith('/more') },
];

/** Web layout navigation (Section 18 #34): replaces the bottom tab bar on wide screens. */
export function Sidebar() {
  const pathname = usePathname();
  const { lock } = useSession();
  const profile = useProfile();
  const notifications = useNotifications();
  const open = useOpenRequest();
  const hasAlert =
    (notifications.data ?? []).some((n) => !n.is_read) ||
    (!!open.data && ['submitted', 'verified', 'released'].includes(open.data.status));

  return (
    <View style={styles.sidebar} accessibilityRole="menu">
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.items}>
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Pressable
              key={item.href}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(item.href as never)}
              style={(state) => [
                styles.item,
                active && styles.itemActive,
                isHovered(state) && !active && styles.itemHover,
              ]}
            >
              <Icon color={active ? tokens.color.surface : tokens.color.primary} size={20} />
              <Text style={[styles.itemText, active && styles.itemTextActive]} numberOfLines={1}>
                {item.label}
              </Text>
              {item.href === '/' && hasAlert ? <View testID="sidebar-dot" style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.bottom}>
        {profile.data ? (
          <View style={styles.user}>
            <Text style={styles.userName} numberOfLines={1}>
              {profile.data.full_name ?? profile.data.email}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {profile.data.email}
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lock"
          onPress={lock}
          style={(state) => [styles.item, isHovered(state) && styles.itemHover]}
        >
          <Lock color={tokens.color.primary} size={20} />
          <Text style={styles.itemText}>Lock</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: tokens.layout.sidebar,
    backgroundColor: tokens.color.surface,
    borderRightWidth: 1,
    borderRightColor: tokens.color.divider,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[6],
    gap: tokens.space[6],
  },
  logo: { paddingHorizontal: tokens.space[2] },
  items: { gap: tokens.space[1], flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4] - tokens.space[1],
    minHeight: tokens.size.touchMin - tokens.space[1],
    paddingHorizontal: tokens.space[4] - tokens.space[1],
    borderRadius: tokens.radius.button,
  },
  itemActive: { backgroundColor: tokens.color.primary },
  itemHover: { backgroundColor: tokens.color.background },
  itemText: { ...tokens.font.body, color: tokens.color.text, flex: 1 },
  itemTextActive: { ...tokens.font.button, color: tokens.color.surface },
  dot: {
    width: tokens.space[2],
    height: tokens.space[2],
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.color.badge,
  },
  bottom: {
    gap: tokens.space[2],
    borderTopWidth: 1,
    borderTopColor: tokens.color.divider,
    paddingTop: tokens.space[4],
  },
  user: { paddingHorizontal: tokens.space[4] - tokens.space[1] },
  userName: { ...tokens.font.button, color: tokens.color.text },
  userEmail: { ...tokens.font.small, color: tokens.color.textSecondary },
});
