-- 0005 App functions (Section 10). Functions that read other people's rows are
-- security definer and check the caller themselves; each returns only what the
-- caller may see.

-- OP36 get_readiness (BR10) --------------------------------------------------
create or replace function public.get_readiness()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select * from public.users where id = auth.uid()),
  has_cat as (
    select category from public.documents where owner_id = auth.uid()
    union
    select category from public.assets where owner_id = auth.uid()
  ),
  items as (
    select 'profile' as key, 1 as ord, (select full_name is not null from me) as done
    union all select 'identity', 2, exists (select 1 from public.documents where owner_id = auth.uid() and category = 'identity')
    union all select 'insurance', 3, exists (select 1 from has_cat where category = 'insurance')
    union all select 'property_vehicles', 4,
      exists (select 1 from has_cat where category in ('property', 'vehicles'))
      or coalesce((select owns_no_property_or_vehicle from me), false)
    union all select 'banking', 5, exists (select 1 from has_cat where category = 'banking_investments')
    union all select 'emergency', 6, exists (
      select 1 from public.emergency_profiles ep
      where ep.owner_id = auth.uid() and jsonb_array_length(ep.emergency_contacts) >= 1
        and coalesce(btrim(ep.medical_aid_provider), '') <> '')
    union all select 'contact', 7, exists (
      select 1 from public.trusted_contacts where owner_id = auth.uid() and status = 'accepted')
    union all select 'instruction', 8, exists (
      select 1 from public.instructions where owner_id = auth.uid() and kind = 'instruction')
  )
  select jsonb_build_object(
    'items', (select jsonb_agg(jsonb_build_object('key', key, 'done', coalesce(done, false)) order by ord) from items),
    'done', (select count(*) from items where coalesce(done, false))
  );
$$;

-- OP37 confirm_review (BR11) -------------------------------------------------
create or replace function public.confirm_review()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  update public.users set last_reviewed_at = now() where id = auth.uid();
  update public.notifications set is_read = true
   where recipient_id = auth.uid() and type = 'review_due' and not is_read;
end;
$$;

-- get_invite_email: for S2 invite mode (no account yet). Returns only the
-- email, the owner's name and the expiry for a valid token.
create or replace function public.get_invite_email(token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('email', tc.email, 'expires_at', tc.invite_expires_at,
                            'owner_name', public.display_name(tc.owner_id), 'status', tc.status)
  from public.trusted_contacts tc where tc.invite_token = token;
$$;

-- OP25 accept_invite / decline_invite (SEC12) ---------------------------------
create or replace function public.accept_invite(token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact public.trusted_contacts;
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select * into contact from public.trusted_contacts tc where tc.invite_token = token for update;
  if not found or contact.email <> public.my_email() then
    raise exception 'not_allowed';
  end if;
  if contact.status = 'accepted' and contact.contact_user_id = auth.uid() then
    return contact.owner_id;
  end if;
  if contact.status = 'expired' or (contact.status = 'invited' and contact.invite_expires_at < now()) then
    raise exception 'invite_expired';
  end if;
  if contact.status <> 'invited' then
    raise exception 'not_allowed';
  end if;
  update public.trusted_contacts set status = 'accepted', contact_user_id = auth.uid() where id = contact.id;
  return contact.owner_id;
end;
$$;

create or replace function public.decline_invite(token uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact public.trusted_contacts;
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select * into contact from public.trusted_contacts tc where tc.invite_token = token for update;
  if not found or contact.email <> public.my_email() or contact.status <> 'invited' then
    raise exception 'not_allowed';
  end if;
  update public.trusted_contacts set status = 'declined' where id = contact.id;
end;
$$;

-- OP23 resend_invite (BR4) ---------------------------------------------------
create or replace function public.resend_invite(contact_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trusted_contacts
     set status = 'invited', invite_token = gen_random_uuid(), invite_expires_at = now() + interval '14 days'
   where id = contact_id and owner_id = auth.uid() and status in ('invited', 'expired', 'declined');
  if not found then raise exception 'not_allowed'; end if;
end;
$$;

-- OP24 get_people --------------------------------------------------------------
create or replace function public.get_people()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'contacts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tc.id, 'name', tc.name, 'relationship', tc.relationship, 'email', tc.email, 'phone', tc.phone,
        'access_level', tc.access_level, 'allowed_sections', tc.allowed_sections,
        'status', case when tc.status = 'invited' and tc.invite_expires_at < now() then 'expired' else tc.status end,
        'invite_expires_at', tc.invite_expires_at, 'created_at', tc.created_at) order by tc.created_at)
      from public.trusted_contacts tc where tc.owner_id = auth.uid()), '[]'::jsonb),
    'shared_with_me', coalesce((
      select jsonb_agg(jsonb_build_object(
        'owner_id', tc.owner_id, 'owner_name', public.display_name(tc.owner_id),
        'access_level', tc.access_level, 'vault_status', u.vault_status) order by tc.created_at)
      from public.trusted_contacts tc join public.users u on u.id = tc.owner_id
      where tc.contact_user_id = auth.uid() and tc.status = 'accepted'), '[]'::jsonb),
    'invites', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', tc.id, 'token', tc.invite_token, 'owner_name', public.display_name(tc.owner_id),
        'access_level', tc.access_level, 'expires_at', tc.invite_expires_at,
        'expired', tc.invite_expires_at < now()) order by tc.created_at)
      from public.trusted_contacts tc
      where tc.status = 'invited' and tc.email = public.my_email()), '[]'::jsonb)
  );
$$;

-- OP31 get_shared_vault (BR5, BR8) ---------------------------------------------
create or replace function public.get_shared_vault(owner uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  contact public.trusted_contacts;
  vault_owner public.users;
  released boolean;
  my_request jsonb;
  profile jsonb;
begin
  if me is null then raise exception 'not_allowed'; end if;
  select * into vault_owner from public.users where id = owner;
  if not found then raise exception 'vault_gone'; end if;
  select * into contact from public.trusted_contacts tc
   where tc.owner_id = owner and tc.contact_user_id = me and tc.status = 'accepted';
  if not found then raise exception 'not_allowed'; end if;

  released := vault_owner.vault_status = 'released';

  select jsonb_build_object('id', r.id, 'status', r.status, 'reason', r.reason, 'submitted_at', r.submitted_at,
                            'waiting_ends_at', r.waiting_ends_at, 'released_at', r.released_at, 'admin_note', r.admin_note)
    into my_request
    from public.access_requests r where r.owner_id = owner and r.requester_id = me
   order by r.submitted_at desc limit 1;

  select jsonb_build_object('emergency_contacts', ep.emergency_contacts, 'medical_aid_provider', ep.medical_aid_provider,
                            'medical_aid_number', ep.medical_aid_number, 'key_notes', ep.key_notes, 'updated_at', ep.updated_at)
    into profile
    from public.emergency_profiles ep where ep.owner_id = owner and (ep.share_now or released);

  return jsonb_build_object(
    'owner_id', owner,
    'owner_name', public.display_name(owner),
    'access_level', contact.access_level,
    'allowed_sections', contact.allowed_sections,
    'vault_status', vault_owner.vault_status,
    'other_request_open', exists (select 1 from public.access_requests r
                                  where r.owner_id = owner and r.status in ('submitted', 'verified')
                                    and r.requester_id is distinct from me),
    'my_request', my_request,
    'emergency_profile', profile,
    'documents', case when released then coalesce((
      select jsonb_agg(jsonb_build_object('id', d.id, 'title', d.title, 'category', d.category,
                                          'file_type', d.file_type, 'created_at', d.created_at, 'notes', d.notes)
                       order by d.category, d.created_at desc)
      from public.documents d where d.owner_id = owner and public.can_see_section(owner, me, d.category)), '[]'::jsonb)
      else '[]'::jsonb end,
    'assets', case when released then coalesce((
      select jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'category', a.category, 'type', a.type,
                                          'provider', a.provider, 'provider_phone', a.provider_phone,
                                          'reference_number', a.reference_number, 'last4', a.last4,
                                          'originals_location', a.originals_location, 'notes', a.notes)
                       order by a.category, a.name)
      from public.assets a where a.owner_id = owner and public.can_see_section(owner, me, a.category)), '[]'::jsonb)
      else '[]'::jsonb end,
    'instructions', case when released and public.can_see_section(owner, me, 'instructions') then coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'section', i.section, 'text', i.text, 'updated_at', i.updated_at)
                       order by i.section, i.created_at)
      from public.instructions i where i.owner_id = owner and i.kind = 'instruction'), '[]'::jsonb)
      else '[]'::jsonb end,
    'messages', case when released then coalesce((
      select jsonb_agg(jsonb_build_object('id', i.id, 'text', i.text, 'updated_at', i.updated_at) order by i.created_at)
      from public.instructions i where i.owner_id = owner and i.kind = 'message' and i.recipient_id = contact.id), '[]'::jsonb)
      else '[]'::jsonb end
  );
end;
$$;

-- OP33 get_my_open_request -----------------------------------------------------
create or replace function public.get_my_open_request()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'status', r.status, 'reason', r.reason, 'submitted_at', r.submitted_at,
    'waiting_ends_at', r.waiting_ends_at, 'released_at', r.released_at,
    'requester_name', coalesce(tc.name, public.display_name(r.requester_id)))
  from public.access_requests r left join public.trusted_contacts tc on tc.id = r.contact_id
  where r.owner_id = auth.uid() and r.status in ('submitted', 'verified', 'released')
  order by r.submitted_at desc limit 1;
$$;

-- OP34 cancel_access_request (BR7) ---------------------------------------------
create or replace function public.cancel_access_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests set status = 'cancelled', closed_at = now()
   where id = request_id and owner_id = auth.uid() and status in ('submitted', 'verified');
  if not found then raise exception 'not_allowed'; end if;
end;
$$;

-- OP35 revoke_release (BR8) ----------------------------------------------------
create or replace function public.revoke_release()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.access_requests set status = 'revoked', closed_at = now()
   where owner_id = auth.uid() and status = 'released';
  if not found then raise exception 'not_allowed'; end if;
end;
$$;

-- OP26 get_access_history (BR13) ----------------------------------------------
create or replace function public.get_access_history(contact_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', al.id, 'action', al.action, 'created_at', al.created_at,
           'item_title', (select d.title from public.documents d where d.id = al.item_id))
         order by al.created_at desc), '[]'::jsonb)
  from public.audit_log al
  join public.trusted_contacts tc on tc.id = contact_id and tc.owner_id = auth.uid()
  where al.owner_id = auth.uid()
    and (al.item_id = tc.id
         or (tc.contact_user_id is not null and al.actor_id = tc.contact_user_id)
         or al.item_id in (select r.id from public.access_requests r where r.contact_id = tc.id));
$$;

-- Account deletion helper used by the delete-account Edge Function (OP6) -------
-- Returns the owner ids whose open requests this user made, for the caller's info.

revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_readiness(), public.confirm_review(), public.accept_invite(uuid),
  public.decline_invite(uuid), public.resend_invite(uuid), public.get_people(), public.get_shared_vault(uuid),
  public.get_my_open_request(), public.cancel_access_request(uuid), public.revoke_release(),
  public.get_access_history(uuid), public.is_accepted_contact(uuid, uuid), public.contact_level(uuid, uuid),
  public.is_released(uuid), public.can_see_section(uuid, uuid, text), public.my_email(),
  public.is_category(text), public.valid_emergency_contacts(jsonb)
  to authenticated;
-- S2 invite mode is shown before the person has an account.
grant execute on function public.get_invite_email(uuid), public.is_category(text), public.valid_emergency_contacts(jsonb)
  to anon, authenticated;
