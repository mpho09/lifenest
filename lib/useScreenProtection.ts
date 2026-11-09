import { usePreventScreenCapture } from 'expo-screen-capture';
import { Platform } from 'react-native';

/** Blocks screenshots while S9 or S20 is open on Android (T-S9-2). Not possible in a browser (Section 18 #31). */
const usePlatformProtection = Platform.OS === 'web' ? () => {} : usePreventScreenCapture;

export function useScreenProtection() {
  usePlatformProtection();
}
