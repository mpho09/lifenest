import { Platform } from 'react-native';

import { deletePin } from '../lock/pin';
import { clearSessionStart, markSessionStart } from '../lock/session';
import { messages } from '../messages';
import { supabase } from '../supabase';

/** Base address for links in emails: the web app itself, or the redirect page (Section 11). */
export function appBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return process.env.EXPO_PUBLIC_LINK_BASE_URL ?? '';
}

export type AuthResult = { ok: true } | { ok: false; message: string; code?: 'email_taken' | 'unverified' };

/** OP1 Sign up (PRD 5). */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: `${appBaseUrl()}/log-in?verified=1`, data: { is_18_or_older: true } },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) {
      return { ok: false, code: 'email_taken', message: messages.emailTaken };
    }
    if (error.status === 429) return { ok: false, message: messages.tooManyAttempts };
    return { ok: false, message: messages.serverError };
  }
  // With email confirmation on, an existing address comes back with no identities.
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { ok: false, code: 'email_taken', message: messages.emailTaken };
  }
  return { ok: true };
}

/** OP2 Log in. */
export async function logIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (!error) {
    await markSessionStart();
    return { ok: true };
  }
  const code = (error as { code?: string }).code;
  if (code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
    return { ok: false, code: 'unverified', message: messages.verifyFirst };
  }
  if (error.status === 429 || code === 'over_request_rate_limit') {
    return { ok: false, message: messages.tooManyAttempts };
  }
  if (code === 'invalid_credentials' || error.status === 400) {
    return { ok: false, message: messages.wrongPassword };
  }
  return { ok: false, message: messages.serverError };
}

export async function resendVerification(email: string): Promise<void> {
  await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: `${appBaseUrl()}/log-in?verified=1` },
  });
}

/** OP3: always the same answer, so nobody can learn whether an account exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${appBaseUrl()}/forgot-password`,
  });
}

/** OP4: called on S4 after the reset link brought the user back with a code. */
export async function exchangeResetCode(code: string): Promise<boolean> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return !error;
}

export async function setNewPassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: messages.serverError };
  await markSessionStart();
  return { ok: true };
}

/** OP5: the PIN hash stays, so the same person can log in again on this device. */
export async function logOut(): Promise<void> {
  await supabase.auth.signOut();
  await clearSessionStart();
}

/** OP6 delete account through the delete-account Edge Function (SEC22). */
export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { body: {} });
  if (error) throw { message: 'server_error' };
  await deletePin(userId);
  await supabase.auth.signOut({ scope: 'local' });
  await clearSessionStart();
}
