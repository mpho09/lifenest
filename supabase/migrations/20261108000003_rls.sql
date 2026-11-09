-- 0003 Row level security and column privileges (Section 9, SEC1–SEC16)

alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.assets enable row level security;
alter table public.asset_documents enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.instructions enable row level security;
alter table public.emergency_profiles enable row level security;
alter table public.access_requests enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;

-- Start from nothing for app roles, then grant only what is needed.
revoke all on all tables in schema public from anon, authenticated;

-- SEC1, SEC2: users ---------------------------------------------------------
grant select on public.users to authenticated;
grant update (full_name, phone, owns_no_property_or_vehicle) on public.users to authenticated;

create policy users_select_own on public.users
  for select to authenticated using (id = (select auth.uid()));
create policy users_update_own on public.users
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- SEC3, SEC4: documents -----------------------------------------------------
grant select, insert, delete on public.documents to authenticated;
grant update (title, category, notes, file_path, file_type, size_kb) on public.documents to authenticated;

create policy documents_select on public.documents
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.can_see_section(owner_id, (select auth.uid()), category));
create policy documents_insert on public.documents
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy documents_update on public.documents
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy documents_delete on public.documents
  for delete to authenticated using (owner_id = (select auth.uid()));

-- SEC3, SEC5: assets --------------------------------------------------------
grant select, insert, delete on public.assets to authenticated;
grant update (category, type, name, provider, provider_phone, reference_number, last4,
              originals_location, notes, deleted_document_count) on public.assets to authenticated;

create policy assets_select on public.assets
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.can_see_section(owner_id, (select auth.uid()), category));
create policy assets_insert on public.assets
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy assets_update on public.assets
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy assets_delete on public.assets
  for delete to authenticated using (owner_id = (select auth.uid()));

-- SEC3, SEC5: asset_documents ----------------------------------------------
grant select, insert, delete on public.asset_documents to authenticated;

create policy asset_documents_select on public.asset_documents
  for select to authenticated
  using (exists (
    select 1 from public.assets a
    where a.id = asset_id
      and (a.owner_id = (select auth.uid()) or public.can_see_section(a.owner_id, (select auth.uid()), a.category))
  ));
create policy asset_documents_insert on public.asset_documents
  for insert to authenticated
  with check (exists (select 1 from public.assets a where a.id = asset_id and a.owner_id = (select auth.uid())));
create policy asset_documents_delete on public.asset_documents
  for delete to authenticated
  using (exists (select 1 from public.assets a where a.id = asset_id and a.owner_id = (select auth.uid())));

-- SEC11, SEC12: trusted_contacts --------------------------------------------
grant select, delete on public.trusted_contacts to authenticated;
grant insert (name, relationship, email, phone, access_level, allowed_sections) on public.trusted_contacts to authenticated;
grant update (name, relationship, phone, access_level, allowed_sections) on public.trusted_contacts to authenticated;

create policy trusted_contacts_select on public.trusted_contacts
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or contact_user_id = (select auth.uid())
    or (status = 'invited' and email = (select public.my_email()))
  );
create policy trusted_contacts_insert on public.trusted_contacts
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy trusted_contacts_update on public.trusted_contacts
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy trusted_contacts_delete on public.trusted_contacts
  for delete to authenticated using (owner_id = (select auth.uid()));

-- SEC6–SEC8: instructions and personal messages -----------------------------
grant select, insert, delete on public.instructions to authenticated;
grant update (section, recipient_id, text) on public.instructions to authenticated;

create policy instructions_select on public.instructions
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (kind = 'instruction' and public.can_see_section(owner_id, (select auth.uid()), 'instructions'))
    or (kind = 'message' and public.is_released(owner_id) and exists (
          select 1 from public.trusted_contacts tc
          where tc.id = recipient_id and tc.contact_user_id = (select auth.uid()) and tc.status = 'accepted'))
  );
create policy instructions_insert on public.instructions
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy instructions_update on public.instructions
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy instructions_delete on public.instructions
  for delete to authenticated using (owner_id = (select auth.uid()));

-- SEC9, SEC10: emergency_profiles -------------------------------------------
grant select, insert, delete on public.emergency_profiles to authenticated;
grant update (emergency_contacts, medical_aid_provider, medical_aid_number, key_notes, share_now)
  on public.emergency_profiles to authenticated;

create policy emergency_profiles_select on public.emergency_profiles
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (public.is_accepted_contact(owner_id, (select auth.uid())) and (share_now or public.is_released(owner_id)))
  );
create policy emergency_profiles_insert on public.emergency_profiles
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy emergency_profiles_update on public.emergency_profiles
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy emergency_profiles_delete on public.emergency_profiles
  for delete to authenticated using (owner_id = (select auth.uid()));

-- SEC13–SEC15: access_requests ----------------------------------------------
-- Nobody can read the proof file paths through the API (the admin uses Studio).
grant select (id, owner_id, contact_id, requester_id, reason, declaration_ticked, status, submitted_at,
              waiting_ends_at, verified_at, released_at, closed_at, reminder_sent_at, admin_note)
  on public.access_requests to authenticated;
grant insert (id, owner_id, reason, proof_path, requester_id_path, declaration_ticked)
  on public.access_requests to authenticated;
-- No update or delete grants: status changes only through functions (SEC15).

create policy access_requests_select on public.access_requests
  for select to authenticated
  using (owner_id = (select auth.uid()) or requester_id = (select auth.uid()));
create policy access_requests_insert on public.access_requests
  for insert to authenticated
  with check (public.contact_level(owner_id, (select auth.uid())) in ('selected', 'full'));

-- SEC16: audit_log and notifications ----------------------------------------
grant select on public.audit_log to authenticated;
create policy audit_log_select on public.audit_log
  for select to authenticated using (owner_id = (select auth.uid()));

grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy notifications_select on public.notifications
  for select to authenticated using (recipient_id = (select auth.uid()));
create policy notifications_update on public.notifications
  for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

-- Helper functions: callable by signed-in users only.
revoke execute on function public.is_accepted_contact(uuid, uuid), public.contact_level(uuid, uuid),
  public.is_released(uuid), public.can_see_section(uuid, uuid, text), public.my_email() from public, anon;
grant execute on function public.is_accepted_contact(uuid, uuid), public.contact_level(uuid, uuid),
  public.is_released(uuid), public.can_see_section(uuid, uuid, text), public.my_email() to authenticated;
