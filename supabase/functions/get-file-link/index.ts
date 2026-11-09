// OP13 get-file-link (SEC20, BR13).
// Reads the document WITH THE CALLER'S TOKEN, so RLS (SEC4) decides access.
// Only if the row comes back does it sign a 60-second link with the service role.
// A trusted contact's view or download is written to the audit log.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData } = await userClient.auth.getUser();
  const user = userData.user;
  if (!user) return json({ error: 'not_allowed' }, 401);

  let body: { document_id?: string; purpose?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const purpose = body.purpose === 'download' ? 'download' : 'view';
  if (!body.document_id) return json({ error: 'bad_request' }, 400);

  const { data: doc } = await userClient
    .from('documents')
    .select('id, owner_id, file_path, title, file_type')
    .eq('id', body.document_id)
    .maybeSingle();

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (!doc) {
    // Tell "deleted" apart from "not allowed" without revealing anything else.
    const { data: exists } = await admin.from('documents').select('id').eq('id', body.document_id).maybeSingle();
    return json({ error: exists ? 'not_allowed' : 'gone' }, exists ? 403 : 404);
  }

  const fileName = `${doc.title.replace(/[^\w\- ]+/g, '').trim() || 'document'}.${doc.file_type}`;
  const { data: signed, error } = await admin.storage
    .from('vault')
    .createSignedUrl(doc.file_path, 60, purpose === 'download' ? { download: fileName } : undefined);
  if (error || !signed) return json({ error: 'server_error' }, 500);

  if (doc.owner_id !== user.id) {
    await admin.from('audit_log').insert({
      owner_id: doc.owner_id,
      actor_id: user.id,
      action: purpose === 'download' ? 'downloaded' : 'viewed',
      item_id: doc.id,
    });
  }

  return json({ url: signed.signedUrl, expires_in: 60 });
});
