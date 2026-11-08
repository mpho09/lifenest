// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // React Three Fiber elements take Three.js props (position, args, ...).
    files: ["components/three/**/*.tsx"],
    rules: { "react/no-unknown-property": "off" },
  },
  {
    ignores: ['dist/*', 'coverage/*', 'supabase/functions/*'],
  },
]);
