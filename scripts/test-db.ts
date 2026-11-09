/**
 * Runs every pgTAP file in supabase/tests against the linked hosted project
 * without Docker (Section 18 #23): each file runs inside its own transaction
 * and rolls back; finish(true) makes a failing file exit non-zero.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '..', 'supabase', 'tests');
const files = readdirSync(dir).filter((f) => f.endsWith('.test.sql')).sort();
let failed = 0;

for (const file of files) {
  try {
    execFileSync('npx', ['supabase', 'db', 'query', '--remote', '--yes', '-f', join(dir, file)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    console.log(`ok   ${file}`);
  } catch (e) {
    failed += 1;
    const out = String((e as { stdout?: Buffer }).stdout ?? '') + String((e as { stderr?: Buffer }).stderr ?? '');
    console.log(`FAIL ${file}\n${out.slice(-2000)}`);
  }
}

console.log(`${files.length - failed} / ${files.length} pgTAP files passed`);
process.exit(failed ? 1 : 0);
