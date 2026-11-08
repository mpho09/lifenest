import { Redirect } from 'expo-router';

/**
 * Phase 1 only: the app opens on S1. Phase 3 replaces this with the
 * Section 11 redirects and moves "/" to S7 Home in (tabs)/index.tsx.
 */
export default function Index() {
  return <Redirect href="/welcome" />;
}
