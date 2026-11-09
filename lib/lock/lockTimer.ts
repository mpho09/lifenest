/** BR9: the app locks when it comes back after more than 5 minutes in the background. */
export const BACKGROUND_LOCK_MS = 5 * 60 * 1000;

export function shouldLockAfterBackground(backgroundedAt: number | null, now: number): boolean {
  return backgroundedAt !== null && now - backgroundedAt > BACKGROUND_LOCK_MS;
}
