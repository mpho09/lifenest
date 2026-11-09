import * as Crypto from 'expo-crypto';

import { lockStorage } from './storage';

/** BR9: 5 wrong PINs log the user out. */
export const MAX_PIN_ATTEMPTS = 5;
export const PIN_LENGTH = 6;

export type PinRecord = { salt: string; hash: string; fingerprint: boolean };

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + pin);
}

/** SHA-256(salt + PIN) with a random 16-byte salt. The PIN itself is never stored or sent. */
export async function createPinRecord(pin: string, fingerprint = false): Promise<PinRecord> {
  const salt = toHex(Crypto.getRandomBytes(16));
  return { salt, hash: await hashPin(pin, salt), fingerprint };
}

export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  return (await hashPin(pin, record.salt)) === record.hash;
}

const keyFor = (userId: string) => `lifenest_pin_${userId}`;

export async function loadPinRecord(userId: string): Promise<PinRecord | null> {
  const raw = await lockStorage.get(keyFor(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinRecord;
  } catch {
    return null;
  }
}

export async function savePin(userId: string, pin: string, fingerprint: boolean): Promise<void> {
  await lockStorage.set(keyFor(userId), JSON.stringify(await createPinRecord(pin, fingerprint)));
}

export async function deletePin(userId: string): Promise<void> {
  await lockStorage.remove(keyFor(userId));
}
