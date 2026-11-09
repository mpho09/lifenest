import { createPinRecord, verifyPin, MAX_PIN_ATTEMPTS } from '../../lib/lock/pin';
import { shouldLockAfterBackground } from '../../lib/lock/lockTimer';
import { isSessionTooOld } from '../../lib/lock/session';

jest.mock('expo-crypto', () => {
  const { createHash, randomBytes } = jest.requireActual('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_alg: string, data: string) => createHash('sha256').update(data).digest('hex'),
    getRandomBytes: (n: number) => new Uint8Array(randomBytes(n)),
  };
});

describe('PIN (BR9)', () => {
  it('T-LOCK-1 stores a salted SHA-256 hash, never the PIN', async () => {
    const record = await createPinRecord('123456');
    expect(JSON.stringify(record)).not.toContain('123456');
    expect(record.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(record.salt).toMatch(/^[0-9a-f]{32}$/); // 16 random bytes
  });

  it('T-LOCK-1 two users with the same PIN get different hashes', async () => {
    const a = await createPinRecord('123456');
    const b = await createPinRecord('123456');
    expect(a.hash).not.toBe(b.hash);
  });

  it('T-LOCK-1 verifies the right PIN and rejects a wrong one', async () => {
    const record = await createPinRecord('246810');
    await expect(verifyPin('246810', record)).resolves.toBe(true);
    await expect(verifyPin('246811', record)).resolves.toBe(false);
  });

  it('allows 5 attempts', () => {
    expect(MAX_PIN_ATTEMPTS).toBe(5);
  });
});

describe('background lock (BR9)', () => {
  it('T-US3-2 locks after more than 5 minutes in the background, not before', () => {
    const now = 1_000_000_000;
    expect(shouldLockAfterBackground(now - 5 * 60_000 - 1, now)).toBe(true);
    expect(shouldLockAfterBackground(now - 4 * 60_000, now)).toBe(false);
    expect(shouldLockAfterBackground(null, now)).toBe(false);
  });
});

describe('30-day session (Section 18 #6)', () => {
  it('T-AUTH-3 a session older than 30 days is too old; a newer one is kept', () => {
    const now = Date.UTC(2026, 10, 30);
    expect(isSessionTooOld(now - 31 * 86_400_000, now)).toBe(true);
    expect(isSessionTooOld(now - 29 * 86_400_000, now)).toBe(false);
    expect(isSessionTooOld(null, now)).toBe(false);
  });
});
