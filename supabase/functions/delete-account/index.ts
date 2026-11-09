// OP6 delete-account (SEC22, BR12).
// Uses only the caller's token to find who to delete; any id in the body is ignored.
// Removes the caller's files from both buckets, then deletes the Auth user, which
// cascades to every row of their vault and their trusted-contact links.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Admin = ReturnType<typeof createClient>;

async function listAll(admin: Admin, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) {
      paths.push(...(await listAll(admin, bucket, path))); // a folder
    } else {
      paths.push(path);
    }
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'not_allowed' }, 405);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data } = await userClient.auth.getUser();
  const user = data.user;
  if (!user) return json({ error: 'not_allowed' }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  for (const bucket of ['vault', 'proof']) {
    const files = await listAll(admin, bucket, user.id);
    for (let i = 0; i < files.length; i += 100) {
      const { error } = await admin.storage.from(bucket).remove(files.slice(i, i + 100));
      if (error) return json({ error: 'server_error' }, 500);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return json({ error: 'server_error' }, 500);

  return json({ deleted: true });
});
