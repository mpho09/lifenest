-- 0006 Admin functions (ADM1, ADM2) and scheduled jobs (Section 8.5).
-- None of these can be called by app users (SEC21).

create or replace function public.admin_verify_request(request_id uuid, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests
     set status = 'verified', verified_at = now(), admin_note = coalesce(note, admin_note)
   where id = request_id and status = 'submitted';
  if not found then raise exception 'Request % is not waiting for verification', request_id; end if;
end;
$$;

create or replace function public.admin_reject_request(request_id uuid, note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests
     set status = 'rejected', closed_at = now(), admin_note = note
   where id = request_id and status = 'submitted';
  if not found then raise exception 'Request % is not waiting for verification', request_id; end if;
end;
$$;

-- run_hourly_jobs: invite expiry (BR4), day-3 reminder and release (BR7, BR8),
-- 6-monthly review reminder (BR11).
create or replace function public.run_hourly_jobs()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  -- (1) Expire invites older than 14 days.
  update public.trusted_contacts set status = 'expired'
   where status = 'invited' and invite_expires_at < now();

  -- (2) Day-3 reminder, sent once.
  for r in
    select ar.id, ar.owner_id, coalesce(tc.name, public.display_name(ar.requester_id)) as requester_name
      from public.access_requests ar left join public.trusted_contacts tc on tc.id = ar.contact_id
     where ar.status in ('submitted', 'verified') and ar.reminder_sent_at is null
       and now() >= ar.submitted_at + interval '3 days'
  loop
    perform public.notify(r.owner_id, 'request_reminder',
      'Reminder: ' || r.requester_name || '''s request for access will be released in 4 days unless you cancel it.',
      '/access-alert', true);
    update public.access_requests set reminder_sent_at = now() where id = r.id;
  end loop;

  -- (3) Release verified requests whose waiting period has ended.
  update public.access_requests set status = 'released', released_at = now()
   where status = 'verified' and now() >= waiting_ends_at;

  -- (5) Review reminder every 180 days, once until read.
  insert into public.notifications (recipient_id, type, text, link_target)
  select u.id, 'review_due', 'Time to check your information is still up to date.', '/'
    from public.users u
   where u.last_reviewed_at <= now() - interval '180 days'
     and not exists (select 1 from public.notifications n
                     where n.recipient_id = u.id and n.type = 'review_due' and not n.is_read);
  -- (4) Proof files of requests closed 12+ months ago are removed by an Edge Function
  -- (Storage does not allow deleting files from SQL); see Section 18 #32.
end;
$$;

-- Calls the send-pending-emails Edge Function. Its address and the service role
-- key are read from Supabase Vault, never stored in a migration.
create or replace function public.trigger_send_emails()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text;
  fn_key text;
begin
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'send_emails_url';
  select decrypted_secret into fn_key from vault.decrypted_secrets where name = 'service_role_key';
  if fn_url is null or fn_key is null then
    return;
  end if;
  if not exists (select 1 from public.notifications where email_status = 'pending') then
    return;
  end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Authorization', 'Bearer ' || fn_key, 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

revoke execute on function public.admin_verify_request(uuid, text), public.admin_reject_request(uuid, text),
  public.run_hourly_jobs(), public.trigger_send_emails() from public, anon, authenticated;
