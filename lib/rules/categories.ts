/** BR2: the fixed category list, in PRD order. */
export const CATEGORIES = [
  { key: 'identity', label: 'Identity' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'property', label: 'Property' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'banking_investments', label: 'Banking and investments' },
  { key: 'debts_accounts', label: 'Debts and accounts' },
  { key: 'medical', label: 'Medical' },
  { key: 'business', label: 'Business' },
  { key: 'other', label: 'Other' },
] as const;

export type Category = (typeof CATEGORIES)[number]['key'];

/** Sections a Selected contact can be given: the categories plus instructions (BR5). */
export const SECTIONS = [...CATEGORIES, { key: 'instructions', label: 'Instructions' }] as const;
export type Section = (typeof SECTIONS)[number]['key'];

/** Instruction sections: a category or General (Section 8.1). */
export const INSTRUCTION_SECTIONS = [{ key: 'general', label: 'General' }, ...CATEGORIES] as const;

export function categoryLabel(key: string): string {
  return SECTIONS.find((c) => c.key === key)?.label ?? INSTRUCTION_SECTIONS.find((c) => c.key === key)?.label ?? key;
}

export function isCategory(key: string): key is Category {
  return CATEGORIES.some((c) => c.key === key);
}

export const ASSET_TYPES = [
  { key: 'property', label: 'Property' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'policy', label: 'Policy' },
  { key: 'bank_account', label: 'Bank account' },
  { key: 'card', label: 'Card' },
  { key: 'investment', label: 'Investment' },
  { key: 'debt', label: 'Debt' },
  { key: 'recurring_payment', label: 'Recurring payment' },
  { key: 'other', label: 'Other' },
] as const;

export type AssetType = (typeof ASSET_TYPES)[number]['key'];

export function assetTypeLabel(key: string): string {
  return ASSET_TYPES.find((t) => t.key === key)?.label ?? key;
}

export const ACCESS_LEVELS = [
  { key: 'emergency', label: 'Emergency only' },
  { key: 'selected', label: 'Selected sections' },
  { key: 'full', label: 'Full' },
] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number]['key'];

export function accessLevelLabel(key: string): string {
  return ACCESS_LEVELS.find((l) => l.key === key)?.label ?? key;
}
