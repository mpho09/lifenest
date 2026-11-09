import { router } from 'expo-router';
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Info } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokens } from '../theme/tokens';
import { OfflineBanner } from './OfflineBanner';

const MAX_CONTENT_WIDTH = tokens.size.button * 12; // 576px, keeps the phone layout readable on wide screens

/** Screen frame: safe area, offline banner, scrolling content, centred on the web. */
export function Screen({
  children,
  scroll = true,
  offlineBanner = true,
  refreshing,
  onRefresh,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  offlineBanner?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
    >
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.scrollContent, styles.flex]}>
      <View style={[styles.inner, styles.flex]}>{children}</View>
    </View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {offlineBanner && <OfflineBanner />}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}><View style={styles.inner}>{footer}</View></View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Back arrow + optional right element. */
export function Header({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        style={styles.iconButton}
      >
        <ArrowLeft color={tokens.color.primary} size={24} />
      </Pressable>
      {title ? (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.flex} />
      )}
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function Title({ children, subtitle }: { children: ReactNode; subtitle?: string }) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.title} accessibilityRole="header">
        {children}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Body({ children, secondary, style }: { children: ReactNode; secondary?: boolean; style?: object }) {
  return <Text style={[styles.body, secondary && styles.secondary, style]}>{children}</Text>;
}

export function Small({ children, secondary = true }: { children: ReactNode; secondary?: boolean }) {
  return <Text style={[styles.small, secondary && styles.secondary]}>{children}</Text>;
}

type BannerTone = 'info' | 'error' | 'success' | 'warning';
const bannerColors: Record<BannerTone, { bg: string; fg: string }> = {
  info: { bg: tokens.color.surface, fg: tokens.color.primary },
  error: { bg: tokens.color.surface, fg: tokens.color.error },
  success: { bg: tokens.color.surface, fg: tokens.color.success },
  warning: { bg: tokens.color.surface, fg: tokens.color.warning },
};

/** Inline message box with an icon, text and an optional link-style action. */
export function Banner({
  tone = 'info',
  text,
  actionLabel,
  onAction,
}: {
  tone?: BannerTone;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = bannerColors[tone];
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.fg }]} accessibilityRole="alert">
      <Icon color={c.fg} size={20} />
      <View style={styles.flex}>
        <Text style={[styles.body, { color: tone === 'info' ? tokens.color.text : c.fg }]}>{text}</Text>
        {actionLabel && onAction ? (
          <LinkButton label={actionLabel} onPress={onAction} color={c.fg} />
        ) : null}
      </View>
    </View>
  );
}

export function LinkButton({ label, onPress, color = tokens.color.primary, disabled }: { label: string; onPress: () => void; color?: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.linkText, { color }, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({ label, checked, onChange, children }: { label: string; checked: boolean; onChange: (v: boolean) => void; children?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn]}>
        {checked ? <Check color={tokens.color.surface} size={14} strokeWidth={3} /> : null}
      </View>
      <View style={styles.flex}>{children ?? <Text style={styles.body}>{label}</Text>}</View>
    </Pressable>
  );
}

export function SwitchRow({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <Text style={styles.bodyStrong}>{label}</Text>
        {description ? <Text style={[styles.small, styles.secondary]}>{description}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: tokens.color.primary, false: tokens.color.divider }}
        thumbColor={tokens.color.surface}
      />
    </View>
  );
}

/** Single- or multi-choice pills (categories, access levels, reasons). */
export function Choices<K extends string>({
  label,
  options,
  value,
  onChange,
  multiple,
}: {
  label?: string;
  options: readonly { key: K; label: string }[];
  value: K | K[] | null;
  onChange: (key: K) => void;
  multiple?: boolean;
}) {
  const selected = (k: K) => (Array.isArray(value) ? value.includes(k) : value === k);
  return (
    <View style={styles.choicesWrap}>
      {label ? <Text style={styles.small}>{label}</Text> : null}
      <View style={styles.choices} accessibilityRole={multiple ? undefined : 'radiogroup'}>
        {options.map((o) => (
          <Pressable
            key={o.key}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityLabel={o.label}
            accessibilityState={multiple ? { checked: selected(o.key) } : { selected: selected(o.key) }}
            onPress={() => onChange(o.key)}
            style={[styles.choice, selected(o.key) && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, selected(o.key) && styles.choiceTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Gap({ size = 4 }: { size?: 1 | 2 | 4 | 6 }) {
  return <View style={{ height: tokens.space[size] }} />;
}

export const ui = StyleSheet.create({
  flex: { flex: 1 },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
  small: { ...tokens.font.small, color: tokens.color.text },
  secondary: { color: tokens.color.textSecondary },
});

const styles = StyleSheet.create({
  ...ui,
  screen: { flex: 1, backgroundColor: tokens.color.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: tokens.space.screen, paddingBottom: tokens.space[6] },
  inner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: tokens.space[4] },
  footer: {
    paddingHorizontal: tokens.space.screen,
    paddingVertical: tokens.space[4],
    backgroundColor: tokens.color.background,
    borderTopWidth: 1,
    borderTopColor: tokens.color.divider,
  },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: tokens.size.touchMin, gap: tokens.space[2], paddingTop: tokens.space[2] },
  headerTitle: { ...tokens.font.section, color: tokens.color.text, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  iconButton: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center', marginLeft: -tokens.space[2] },
  titleBlock: { gap: tokens.space[1] },
  title: { ...tokens.font.title, color: tokens.color.text },
  subtitle: { ...tokens.font.body, color: tokens.color.textSecondary },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.space[2] },
  section: { ...tokens.font.section, color: tokens.color.text },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    padding: tokens.space[4],
    gap: tokens.space[2],
    boxShadow: tokens.shadow.card,
  },
  banner: {
    flexDirection: 'row',
    gap: tokens.space[2],
    padding: tokens.space[4],
    borderRadius: tokens.radius.card,
    borderLeftWidth: tokens.space[1],
  },
  link: { minHeight: tokens.size.touchMin, justifyContent: 'center' },
  linkText: { ...tokens.font.button, textDecorationLine: 'underline' },
  disabledText: { opacity: 0.4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[4], minHeight: tokens.size.touchMin },
  checkbox: {
    width: tokens.space[6] - tokens.space[1],
    height: tokens.space[6] - tokens.space[1],
    borderRadius: tokens.space[1],
    borderWidth: 1.5,
    borderColor: tokens.color.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.surface,
  },
  checkboxOn: { backgroundColor: tokens.color.primary, borderColor: tokens.color.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[4], minHeight: tokens.size.touchMin },
  choicesWrap: { gap: tokens.space[2] },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space[2] },
  choice: {
    minHeight: tokens.size.touchMin - tokens.space[2],
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.circle,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    backgroundColor: tokens.color.surface,
    justifyContent: 'center',
  },
  choiceOn: { backgroundColor: tokens.color.primary, borderColor: tokens.color.primary },
  choiceText: { ...tokens.font.small, color: tokens.color.text },
  choiceTextOn: { color: tokens.color.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
});
