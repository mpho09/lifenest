import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** True when the device has fingerprint hardware with an enrolled finger (never on web). */
export async function canUseFingerprint(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function unlockWithFingerprint(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const result = await LocalAuthentication.authenticateAsync({ disableDeviceFallback: true, cancelLabel: 'Cancel' });
  return result.success;
}
