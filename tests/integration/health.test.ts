/**
 * T-SETUP-3: the app's Supabase client reaches the backend.
 * Runs in Node against the hosted dev project (Section 18 #23) using the
 * public EXPO_PUBLIC_ values from .env only.
 */
import { supabase } from '../../lib/supabase';

describe('Supabase connection', () => {
  it('T-SETUP-3 the app Supabase client connects to the backend', async () => {
    expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy();

    // Any table name works: a real HTTP reply (even "table not found") proves the
    // client reached the backend. A network failure gives status 0.
    const { status } = await supabase.from('users').select('id').limit(1);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);
  });
});
