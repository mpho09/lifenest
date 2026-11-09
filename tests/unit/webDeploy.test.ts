import app from '../../app.json';
import vercel from '../../vercel.json';

describe('web preview build for Vercel (Section 18 #28)', () => {
  it('T-WEB-1 the app exports as a single-page web app with Metro', () => {
    expect(app.expo.web).toMatchObject({ bundler: 'metro', output: 'single' });
  });

  it('T-WEB-1 Vercel builds the Expo web export and serves the dist folder', () => {
    // The build stops with a clear message if the public Supabase settings are missing.
    expect(vercel.buildCommand).toBe('node scripts/check-env.js && npx expo export --platform web');
    expect(vercel.outputDirectory).toBe('dist');
  });

  it('T-WEB-1 every route falls back to index.html so deep links like /welcome load', () => {
    expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});

describe('build settings check (scripts/check-env.js)', () => {
  const { missingPublicEnv } = jest.requireActual('../../scripts/check-env.js') as {
    missingPublicEnv: (env: Record<string, string | undefined>) => string[];
  };

  it('T-WEB-2 reports each missing public Supabase setting', () => {
    expect(missingPublicEnv({})).toEqual(['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']);
    expect(missingPublicEnv({ EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' })).toEqual(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  });

  it('T-WEB-2 passes when both are set', () => {
    expect(missingPublicEnv({ EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'k' })).toEqual([]);
  });
});
