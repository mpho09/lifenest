import { lockStorage } from './storage';

/** Section 18 #6: stay logged in for 30 days. */
export const SESSION_MAX_MS = 30 * 24 * 60 * 60 * 1000;
const KEY = 'lifenest_session_started_at';

export function isSessionTooOld(startedAt: number | null, now: number): boolean {
  return startedAt !== null && now - startedAt > SESSION_MAX_MS;
}

export async function markSessionStart(): Promise<void> {
  await lockStorage.set(KEY, String(Date.now()));
}

export async function getSessionStart(): Promise<number | null> {
  const raw = await lockStorage.get(KEY);
  return raw ? Number(raw) : null;
}

export async function clearSessionStart(): Promise<void> {
  await lockStorage.remove(KEY);
}
