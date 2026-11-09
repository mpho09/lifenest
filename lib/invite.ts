import { acceptInvite } from './api/contacts';
import { lockStorage } from './lock/storage';

/** Invite token from an invite link, kept on the device until the invite is accepted (Section 11). */
export const INVITE_TOKEN_KEY = 'lifenest_invite_token';

/**
 * After sign-up, verification and PIN set-up, accept the invite the person
 * arrived with (T-US8-1). The database only accepts it if the email matches.
 */
export async function acceptStoredInvite(): Promise<boolean> {
  const token = await lockStorage.get(INVITE_TOKEN_KEY);
  if (!token) return false;
  try {
    await acceptInvite(token);
    await lockStorage.remove(INVITE_TOKEN_KEY);
    return true;
  } catch (e) {
    const message = (e as { message?: string }).message ?? '';
    // Expired or for a different email: stop trying; the card on S13 explains.
    if (message.includes('invite_expired') || message.includes('not_allowed')) {
      await lockStorage.remove(INVITE_TOKEN_KEY);
    }
    return false;
  }
}
