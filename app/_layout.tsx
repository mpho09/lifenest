import '../global.css';

import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Lora_600SemiBold } from '@expo-google-fonts/lora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { tokens } from '../theme/tokens';

/**
 * Root layout: fonts and providers. Auth and lock redirects (Section 11)
 * are added in Phase 3.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Lora_600SemiBold, Inter_400Regular, Inter_600SemiBold });
  const [queryClient] = useState(() => new QueryClient());

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.color.background },
          }}
        />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
