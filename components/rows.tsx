import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Car,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CreditCard,
  FileImage,
  FileText,
  Folder,
  HeartPulse,
  Home,
  IdCard,
  Receipt,
  Repeat,
  Shield,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AssetRow as Asset, ContactStatus } from '../lib/api/types';
import { messages } from '../lib/messages';
import { accessLevelLabel, assetTypeLabel, categoryLabel, type AccessLevel } from '../lib/rules/categories';
import { formatDate } from '../lib/rules/format';
import { tokens } from '../theme/tokens';
import { Button } from './Button';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  identity: IdCard,
  insurance: Shield,
  property: Home,
  vehicles: Car,
  banking_investments: Banknote,
  debts_accounts: Receipt,
  medical: HeartPulse,
  business: Briefcase,
  other: Folder,
};

const ASSET_ICONS: Record<string, LucideIcon> = {
  property: Home,
  vehicle: Car,
  policy: Shield,
  bank_account: Wallet,
  card: CreditCard,
  investment: TrendingUp,
  debt: Receipt,
  recurring_payment: Repeat,
  other: Folder,
};

function IconTile({ Icon }: { Icon: LucideIcon }) {
  return (
    <View style={styles.iconTile}>
      <Icon color={tokens.color.primary} size={20} />
    </View>
  );
}

/** Category heading with icon and count; tap to expand or collapse (T-C-10). */
export function CategoryRow({
  category,
  count,
  expanded,
  onToggle,
}: {
  category: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${categoryLabel(category)}, ${count}`}
      accessibilityState={{ expanded }}
      onPress={onToggle}
      style={styles.row}
    >
      <IconTile Icon={CATEGORY_ICONS[category] ?? Folder} />
      <Text style={[styles.title, styles.flex]}>{categoryLabel(category)}</Text>
      <Text style={styles.count}>{count}</Text>
      <Chevron color={tokens.color.textSecondary} size={20} />
    </Pressable>
  );
}

/** File-type icon, title, category and date added (T-C-11). */
export function DocumentRow({
  title,
  category,
  fileType,
  createdAt,
  onPress,
}: {
  title: string;
  category: string;
  fileType: string;
  createdAt: string;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} disabled={!onPress} style={styles.row}>
      <IconTile Icon={fileType === 'pdf' ? FileText : FileImage} />
      <View style={styles.flex}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {categoryLabel(category)} · {formatDate(createdAt)}
        </Text>
      </View>
      {onPress ? <ChevronRight color={tokens.color.textSecondary} size={20} /> : null}
    </Pressable>
  );
}

/** Type icon, name, provider and "•••• 1234" (T-C-12). */
export function AssetRow({ asset, onPress }: { asset: Pick<Asset, 'name' | 'type' | 'provider' | 'last4'> & { deleted_document_count?: number }; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={asset.name} onPress={onPress} disabled={!onPress} style={styles.row}>
      <IconTile Icon={ASSET_ICONS[asset.type] ?? Folder} />
      <View style={styles.flex}>
        <Text style={styles.title} numberOfLines={1}>
          {asset.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[asset.provider || assetTypeLabel(asset.type), asset.last4 ? `•••• ${asset.last4}` : null].filter(Boolean).join(' · ')}
        </Text>
        {asset.deleted_document_count ? (
          <View style={styles.inline}>
            <AlertTriangle color={tokens.color.warning} size={14} />
            <Text style={[styles.meta, { color: tokens.color.warning }]}>{messages.documentDeleted}</Text>
          </View>
        ) : null}
      </View>
      {onPress ? <ChevronRight color={tokens.color.textSecondary} size={20} /> : null}
    </Pressable>
  );
}

export type ChipStatus = ContactStatus | 'request_open' | 'released' | 'rejected';

const CHIP: Record<ChipStatus, { label: string; color: string }> = {
  accepted: { label: 'Accepted', color: tokens.color.chip.accepted },
  invited: { label: 'Invited', color: tokens.color.chip.invited },
  expired: { label: 'Expired', color: tokens.color.chip.invited },
  declined: { label: 'Declined', color: tokens.color.chip.invited },
  request_open: { label: 'Request open', color: tokens.color.chip.requestOpen },
  released: { label: 'Released', color: tokens.color.chip.released },
  rejected: { label: 'Rejected', color: tokens.color.chip.rejected },
};

/** Short coloured status label (T-C-14). Gold uses a border, never gold text on light (PRD 9). */
export function StatusChip({ status }: { status: ChipStatus }) {
  const c = CHIP[status];
  const gold = status === 'request_open';
  return (
    <View
      style={[styles.chip, gold ? { borderColor: c.color, backgroundColor: tokens.color.surface } : { backgroundColor: c.color, borderColor: c.color }]}
    >
      <Text style={[styles.chipText, { color: gold ? tokens.color.text : tokens.color.surface }]}>{c.label}</Text>
    </View>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/** Initials circle, name, relationship, status chip and access level (T-C-13). */
export function ContactCard({
  name,
  relationship,
  status,
  accessLevel,
  onPress,
}: {
  name: string;
  relationship: string;
  status: ChipStatus;
  accessLevel: AccessLevel;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={!onPress} style={[styles.row, styles.card]}>
      <View style={styles.initials}>
        <Text style={styles.initialsText}>{initials(name)}</Text>
      </View>
      <View style={[styles.flex, styles.gap]}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.meta}>
          {relationship} · {accessLevelLabel(accessLevel)}
        </Text>
      </View>
      <StatusChip status={status} />
    </Pressable>
  );
}

/** Gold left border, text and a "View" button (T-C-15). */
export function AlertCard({ text, actionLabel, onPress }: { text: string; actionLabel: string; onPress: () => void }) {
  return (
    <View style={[styles.card, styles.alert]} accessibilityRole="alert">
      <Text style={styles.body}>{text}</Text>
      <View style={styles.alertButton}>
        <Button title={actionLabel} variant="secondary" onPress={onPress} />
      </View>
    </View>
  );
}

/** Checklist row: icon, label, tick or arrow (T-C-16). */
export function ChecklistRow({ label, done, icon: Icon, onPress, extra }: { label: string; done: boolean; icon: LucideIcon; onPress: () => void; extra?: ReactNode }) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ checked: done }}
        onPress={onPress}
        style={styles.row}
      >
        <IconTile Icon={Icon} />
        <Text style={[styles.body, styles.flex, done && styles.doneText]}>{label}</Text>
        {done ? (
          <CircleCheck testID="checklist-tick" color={tokens.color.success} size={22} />
        ) : (
          <ChevronRight testID="checklist-arrow" color={tokens.color.textSecondary} size={22} />
        )}
      </Pressable>
      {extra}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { gap: tokens.space[1] },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[4], minHeight: tokens.size.touchMin + tokens.space[2], paddingVertical: tokens.space[2] },
  inline: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[1] },
  iconTile: {
    width: tokens.size.touchMin - tokens.space[2],
    height: tokens.size.touchMin - tokens.space[2],
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.background,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...tokens.font.button, color: tokens.color.text },
  body: { ...tokens.font.body, color: tokens.color.text },
  doneText: { color: tokens.color.textSecondary },
  meta: { ...tokens.font.small, color: tokens.color.textSecondary },
  count: { ...tokens.font.small, color: tokens.color.textSecondary },
  chip: {
    minHeight: tokens.space[6],
    paddingHorizontal: tokens.space[2] + tokens.space[1],
    borderRadius: tokens.radius.circle,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipText: { ...tokens.font.small },
  card: {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    paddingHorizontal: tokens.space[4],
    boxShadow: tokens.shadow.card,
  },
  initials: {
    width: tokens.size.touchMin,
    height: tokens.size.touchMin,
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.color.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { ...tokens.font.button, color: tokens.color.primary },
  alert: { borderLeftWidth: tokens.space[1], borderLeftColor: tokens.color.accent, paddingVertical: tokens.space[4], gap: tokens.space[4] },
  alertButton: { alignSelf: 'flex-start' },
});
