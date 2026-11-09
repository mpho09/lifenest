// OP40 send-pending-emails (PRD 4.5, SEC23).
// Called by pg_cron through trigger_send_emails() with the service role key.
// EMAIL_MODE=log writes the email to the function log (without the link, which
// can contain an invite token) and marks it sent; EMAIL_MODE=send uses Resend.
import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mode = Deno.env.get('EMAIL_MODE') ?? 'log';
const from = Deno.env.get('EMAIL_FROM') ?? 'LifeNest <onboarding@resend.dev>';
const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/$/, '');

const MAX_ATTEMPTS = 3;

const SUBJECTS: Record<string, string> = {
  invite_sent: 'You have been added as a trusted contact on LifeNest',
  request_submitted: 'Someone has asked for access to your LifeNest information',
  request_reminder: 'Reminder: a request for access to your LifeNest information',
  request_cancelled: 'Your LifeNest access request was cancelled',
  request_rejected: 'Your LifeNest access request needs clearer documents',
  vault_released: 'You now have access on LifeNest',
  release_revoked: 'Access closed on LifeNest',
};

Deno.serve(async (req) => {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!serviceKey || token !== serviceKey) {
    return new Response(JSON.stringify({ error: 'not_allowed' }), { status: 401 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: pending, error } = await admin
    .from('notifications')
    .select('id, type, text, link_target, recipient_email, email_attempts, recipient:users(email)')
    .eq('email_status', 'pending')
    .order('created_at')
    .limit(50);
  if (error) return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 });

  let sent = 0;
  let failed = 0;
  for (const n of pending ?? []) {
    const recipient = n.recipient as unknown as { email: string } | null;
    const to = recipient?.email ?? n.recipient_email;
    const subject = SUBJECTS[n.type] ?? 'LifeNest';
    const link = appUrl && n.link_target ? `${appUrl}${n.link_target}` : appUrl;
    let ok = false;

    if (!to) {
      ok = false;
    } else if (mode === 'send') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          subject,
          text: link ? `${n.text}\n\nOpen LifeNest: ${link}` : n.text,
        }),
      });
      ok = res.ok;
    } else {
      console.log(JSON.stringify({ email: 'log', type: n.type, subject, text: n.text }));
      ok = true;
    }

    const attempts = n.email_attempts + 1;
    const status = ok ? 'sent' : attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
    await admin.from('notifications').update({ email_status: status, email_attempts: attempts }).eq('id', n.id);
    if (ok) sent += 1;
    else failed += 1;
  }

  return new Response(JSON.stringify({ sent, failed }), { headers: { 'Content-Type': 'application/json' } });
});
