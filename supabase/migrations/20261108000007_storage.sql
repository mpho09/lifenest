-- 0007 Private Storage buckets and policies (SEC17–SEC19, BR1)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('vault', 'vault', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('proof', 'proof', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- vault: owners upload to and delete from their own folder only (SEC17).
create policy vault_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Storage needs select to delete; owners may sign links for their own files
-- only. Contacts never read storage directly: they use get-file-link (Section 18 #31).
create policy vault_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy vault_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- proof: requesters upload to their own folder; nobody reads, changes or deletes (SEC18, SEC19).
create policy proof_requester_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proof' and (storage.foldername(name))[1] = (select auth.uid())::text);
