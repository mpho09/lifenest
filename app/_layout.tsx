import '../global.css';

import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Lora_600SemiBold } from '@expo-google-fonts/lora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useGlobalSearchParams, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { redirectFor, SessionProvider, useSession } from '../lib/session';
import { tokens } from '../theme/tokens';

/** Root layout: fonts, providers and the Section 11 auth + lock redirects. */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lora_600SemiBold, Inter_400Regular, Inter_600SemiBold });
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.color.background } }}>
            <Stack.Screen name="modals/delete-account" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/delete-item" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/cancel-request" options={{ presentation: 'transparentModal', animation: 'fade' }} />
            <Stack.Screen name="modals/remove-or-close" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </Stack>
        </SessionProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

type Area = 'public' | 'invite' | 'setup' | 'unlock' | 'reset' | 'app';

function areaFor(segments: string[]): Area {
  const [first, second] = segments;
  if (first === '(auth)') return second === 'forgot-password' ? 'reset' : 'public';
  if (first === 'invite') return 'invite';
  if (first === 'profile-setup') return 'setup';
  if (first === 'unlock') return 'unlock';
  return 'app';
}

function AuthGate() {
  const { ready, session, pin, unlocked, recovery, afterUnlock } = useSession();
  const segments = useSegments() as string[];
  const params = useGlobalSearchParams<{ mode?: string }>();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const target = redirectFor({
      ready,
      loggedIn: !!session,
      hasPin: !!pin,
      unlocked,
      recovery,
      area: areaFor(segments),
      changingPin: params.mode === 'pin',
      afterUnlock,
    });
    if (target && target !== pathname) router.replace(target as never);
  }, [ready, session, pin, unlocked, recovery, afterUnlock, segments, params.mode, pathname, router]);

  return null;
}
