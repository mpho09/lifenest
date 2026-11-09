// Shared Jest setup for unit and component tests.
// Expo-gl and React Three Fiber are mocked: 3D scenes are tested through their
// props and the fallback choice, never by drawing pixels (Section 12.2).
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(() => ({ isConnected: true, isInternetReachable: true })),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Placeholder public values so lib/supabase.ts can load in tests (no network is used).
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test-project.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
