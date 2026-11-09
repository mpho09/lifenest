import { messages } from '../messages';
import type { AssetType } from './categories';

/** BR3: the "Last 4 digits" field accepts exactly 4 digits. */
export function isValidLast4(value: string): boolean {
  return /^[0-9]{4}$/.test(value);
}

/** BR3: warn (never block) when notes mention a password or PIN as a whole word. */
export function notesPasswordWarning(notes: string): string | null {
  return /\b(password|pin)\b/i.test(notes) ? messages.passwordWarning : null;
}

/** BR3: last 4 digits only for bank accounts and cards; policy or membership number for the rest. */
export function assetFieldsForType(type: AssetType): { last4: boolean; referenceNumber: boolean } {
  const account = type === 'bank_account' || type === 'card';
  return { last4: account, referenceNumber: !account };
}
