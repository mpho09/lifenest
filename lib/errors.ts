import { messages } from './messages';

type ErrorLike = { message?: string; code?: string; status?: number } | null | undefined;

const BY_MESSAGE: Record<string, string> = {
  limit_documents: messages.documentLimit,
  limit_contacts: messages.contactLimit,
  self_invite: messages.selfInvite,
  invite_expired: messages.inviteExpired,
  request_open: messages.requestOpenElsewhere,
  not_allowed: messages.notAllowed,
  vault_gone: messages.vaultGone,
  gone: messages.documentGone,
};

/** Maps any backend error to an exact PRD message. Raw codes are never shown (PRD 12). */
export function messageForError(error: ErrorLike): string {
  const text = error?.message ?? '';
  for (const [key, message] of Object.entries(BY_MESSAGE)) {
    if (text === key || text.includes(key)) return message;
  }
  if (error?.code === '23505' && text.includes('trusted_contacts')) return messages.duplicateContact;
  if (error?.code === '42501') return messages.notAllowed;
  return messages.serverError;
}
