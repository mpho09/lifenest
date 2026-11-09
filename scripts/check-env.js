/**
 * Build-time check for the web build (Section 18 #28). Expo copies EXPO_PUBLIC_
 * values into the bundle when it builds, so they must be set on the host
 * (e.g. Vercel → Settings → Environment Variables) BEFORE the build. Without
 * them the site would load as a blank page; this stops the build instead.
 * Only public values are checked; secret keys never belong in the web build.
 */
const REQUIRED = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];

function missingPublicEnv(env) {
  return REQUIRED.filter((name) => !env[name] || !String(env[name]).trim());
}

module.exports = { missingPublicEnv };

if (require.main === module) {
  const missing = missingPublicEnv(process.env);
  if (missing.length) {
    console.error(
      `\nLifeNest build stopped: missing ${missing.join(', ')}.\n` +
        'Add them in your host’s environment variables (Vercel: Project → Settings → Environment Variables), then redeploy.\n',
    );
    process.exit(1);
  }
  console.log('LifeNest build settings OK.');
}
