-- 0004 Triggers (Section 8.5). All security definer with an empty search_path.

-- Display name used in notification texts (PRD 4.5): full name, or email if not set yet.
create or replace function public.display_name(user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(u.full_name, u.email) from public.users u where u.id = user_id;
$$;
revoke execute on function public.display_name(uuid) from public, anon, authenticated;

-- handle_new_user: create the users row on sign-up ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, is_18_or_older)
  values (new.id, lower(new.email),
          coalesce((new.raw_user_meta_data ->> 'is_18_or_older')::boolean, false));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- set_updated_at -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger instructions_updated_at before update on public.instructions
  for each row execute function public.set_updated_at();
create trigger emergency_profiles_updated_at before update on public.emergency_profiles
  for each row execute function public.set_updated_at();

-- limit_documents (BR1) ----------------------------------------------------
create or replace function public.limit_documents()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.documents d where d.owner_id = new.owner_id) >= 200 then
    raise exception 'limit_documents';
  end if;
  return new;
end;
$$;

create trigger limit_documents before insert on public.documents
  for each row execute function public.limit_documents();

-- BR12: count deleted documents on the assets they were linked to -----------
create or replace function public.mark_asset_document_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.assets a
     set deleted_document_count = a.deleted_document_count + 1
   where a.id in (select ad.asset_id from public.asset_documents ad where ad.document_id = old.id);
  return old;
end;
$$;

create trigger documents_mark_assets before delete on public.documents
  for each row execute function public.mark_asset_document_deleted();

-- asset_link_same_owner ----------------------------------------------------
create or replace function public.asset_link_same_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select a.owner_id from public.assets a where a.id = new.asset_id)
     is distinct from (select d.owner_id from public.documents d where d.id = new.document_id) then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

create trigger asset_link_same_owner before insert on public.asset_documents
  for each row execute function public.asset_link_same_owner();

-- Trusted contacts: no_self_invite and limit_contacts (BR4) ----------------
create or replace function public.check_trusted_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  if tg_op = 'INSERT' and new.email = (select u.email from public.users u where u.id = new.owner_id) then
    raise exception 'self_invite';
  end if;
  if new.status in ('invited', 'accepted')
     and (tg_op = 'INSERT' or old.status not in ('invited', 'accepted'))
     and (select count(*) from public.trusted_contacts tc
          where tc.owner_id = new.owner_id and tc.status in ('invited', 'accepted') and tc.id <> new.id) >= 5 then
    raise exception 'limit_contacts';
  end if;
  if new.access_level <> 'selected' then
    new.allowed_sections := '{}';
  end if;
  return new;
end;
$$;

create trigger check_trusted_contact before insert or update on public.trusted_contacts
  for each row execute function public.check_trusted_contact();

-- Personal messages go only to the owner's accepted contacts (SEC8) --------
create or replace function public.check_instruction_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'message' and not exists (
    select 1 from public.trusted_contacts tc
    where tc.id = new.recipient_id and tc.owner_id = new.owner_id and tc.status = 'accepted'
  ) then
    raise exception 'not_allowed';
  end if;
  return new;
end;
$$;

create trigger check_instruction_recipient before insert or update on public.instructions
  for each row execute function public.check_instruction_recipient();

-- check_access_request (BR6): the database sets every trusted value ---------
create or replace function public.check_access_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact public.trusted_contacts;
begin
  select * into contact from public.trusted_contacts tc
  where tc.owner_id = new.owner_id and tc.contact_user_id = auth.uid() and tc.status = 'accepted'
    and tc.access_level in ('selected', 'full');
  if not found then
    raise exception 'not_allowed';
  end if;
  if exists (select 1 from public.access_requests r
             where r.owner_id = new.owner_id and r.status in ('submitted', 'verified')) then
    raise exception 'request_open';
  end if;
  if new.proof_path not like auth.uid()::text || '/' || new.id::text || '/%'
     or new.requester_id_path not like auth.uid()::text || '/' || new.id::text || '/%' then
    raise exception 'not_allowed';
  end if;
  new.requester_id := auth.uid();
  new.contact_id := contact.id;
  new.status := 'submitted';
  new.submitted_at := now();
  new.waiting_ends_at := now() + interval '7 days';
  new.verified_at := null;
  new.released_at := null;
  new.closed_at := null;
  new.reminder_sent_at := null;
  new.admin_note := null;
  return new;
end;
$$;

create trigger check_access_request before insert on public.access_requests
  for each row execute function public.check_access_request();

-- sync_vault_status (BR7, BR8) ---------------------------------------------
create or replace function public.sync_vault_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.users u
     set vault_status = case
       when exists (select 1 from public.access_requests r where r.owner_id = new.owner_id and r.status = 'released')
         then 'released'
       when exists (select 1 from public.access_requests r where r.owner_id = new.owner_id and r.status in ('submitted', 'verified'))
         then 'request_open'
       else 'normal' end
   where u.id = new.owner_id;
  return null;
end;
$$;

create trigger sync_vault_status after insert or update on public.access_requests
  for each row execute function public.sync_vault_status();

-- Notifications helper (PRD 4.5 texts) ---------------------------------------
create or replace function public.notify(recipient uuid, kind text, body text, target text, send_email boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if recipient is null then
    return;
  end if;
  insert into public.notifications (recipient_id, type, text, link_target, email_status)
  values (recipient, kind, left(body, 200), target, case when send_email then 'pending' else 'none' end);
end;
$$;
revoke execute on function public.notify(uuid, text, text, text, boolean) from public, anon, authenticated;

-- Trusted contacts: audit + notifications ------------------------------------
create or replace function public.trusted_contact_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitee uuid;
begin
  -- New invite, or a resent invite (new token).
  if tg_op = 'INSERT' or (new.invite_token <> old.invite_token and new.status = 'invited') then
    insert into public.audit_log (owner_id, actor_id, action, item_id)
    values (new.owner_id, new.owner_id, 'invite_sent', new.id);

    select u.id into invitee from public.users u where u.email = new.email;
    insert into public.notifications (recipient_id, recipient_email, type, text, link_target, email_status)
    values (invitee, new.email, 'invite_sent',
            public.display_name(new.owner_id) || ' has added you as a trusted contact on LifeNest. Accept within 14 days.',
            '/invite/' || new.invite_token::text, 'pending');
    return new;
  end if;

  if new.status <> old.status then
    if new.status = 'accepted' then
      insert into public.audit_log (owner_id, actor_id, action, item_id)
      values (new.owner_id, new.contact_user_id, 'invite_accepted', new.id);
      perform public.notify(new.owner_id, 'invite_accepted',
        coalesce(public.display_name(new.contact_user_id), new.name) || ' accepted your invitation.',
        '/contact/edit?id=' || new.id::text, false);
    elsif new.status = 'declined' then
      insert into public.audit_log (owner_id, actor_id, action, item_id)
      values (new.owner_id, auth.uid(), 'invite_declined', new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger trusted_contact_events after insert or update on public.trusted_contacts
  for each row execute function public.trusted_contact_events();

-- contact_removed_cancels_request ------------------------------------------
create or replace function public.contact_removed_cancels_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests r
     set status = 'cancelled', closed_at = now()
   where r.contact_id = old.id and r.status in ('submitted', 'verified');

  if old.contact_user_id is not null and exists (select 1 from public.users u where u.id = old.owner_id) then
    insert into public.audit_log (owner_id, actor_id, action, item_id)
    values (old.owner_id, auth.uid(), 'contact_removed', old.id);
    perform public.notify(old.contact_user_id, 'contact_removed',
      'You are no longer a trusted contact for this person.', '/people', false);
  end if;
  return old;
end;
$$;

create trigger contact_removed_cancels_request before delete on public.trusted_contacts
  for each row execute function public.contact_removed_cancels_request();

-- Access requests: audit + notifications ------------------------------------
create or replace function public.access_request_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester_name text;
  owner_name text;
  c record;
begin
  requester_name := coalesce(
    (select tc.name from public.trusted_contacts tc where tc.id = new.contact_id),
    public.display_name(new.requester_id), 'Your trusted contact');
  owner_name := public.display_name(new.owner_id);

  if tg_op = 'INSERT' then
    insert into public.audit_log (owner_id, actor_id, action, item_id)
    values (new.owner_id, new.requester_id, 'request_submitted', new.id);
    perform public.notify(new.owner_id, 'request_submitted',
      requester_name || ' has asked for access to your information. If you are OK, cancel this request within 7 days.',
      '/access-alert', true);
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.status = 'verified' then
    insert into public.audit_log (owner_id, actor_id, action, item_id) values (new.owner_id, null, 'request_verified', new.id);
  elsif new.status = 'rejected' then
    insert into public.audit_log (owner_id, actor_id, action, item_id) values (new.owner_id, null, 'request_rejected', new.id);
    perform public.notify(new.requester_id, 'request_rejected',
      'We could not verify the documents you sent. Please upload clearer copies.',
      '/shared/' || new.owner_id::text || '/request', true);
  elsif new.status = 'cancelled' then
    insert into public.audit_log (owner_id, actor_id, action, item_id) values (new.owner_id, auth.uid(), 'request_cancelled', new.id);
    perform public.notify(new.requester_id, 'request_cancelled',
      'The account holder has cancelled this request.', '/shared/' || new.owner_id::text, true);
  elsif new.status = 'released' then
    insert into public.audit_log (owner_id, actor_id, action, item_id) values (new.owner_id, null, 'released', new.id);
    for c in select tc.contact_user_id from public.trusted_contacts tc
             where tc.owner_id = new.owner_id and tc.status = 'accepted' and tc.contact_user_id is not null loop
      perform public.notify(c.contact_user_id, 'vault_released',
        'You now have access to ' || owner_name || '''s information.', '/shared/' || new.owner_id::text, true);
    end loop;
  elsif new.status = 'revoked' then
    insert into public.audit_log (owner_id, actor_id, action, item_id) values (new.owner_id, new.owner_id, 'revoked', new.id);
    for c in select tc.contact_user_id from public.trusted_contacts tc
             where tc.owner_id = new.owner_id and tc.status = 'accepted' and tc.contact_user_id is not null loop
      perform public.notify(c.contact_user_id, 'release_revoked',
        owner_name || ' has closed access to their information.', '/people', true);
    end loop;
  end if;
  return new;
end;
$$;

create trigger access_request_events after insert or update on public.access_requests
  for each row execute function public.access_request_events();
