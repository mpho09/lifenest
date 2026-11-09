-- T-DB-6, T-DB-7: always-on security checks (Section 9).
begin;
create extension if not exists pgtap with schema extensions;

select plan(5);

-- T-DB-6: every table in public has RLS switched on.
select is(
  (select count(*)::int from pg_tables t
    join pg_class c on c.relname = t.tablename
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = t.schemaname
   where t.schemaname = 'public' and not c.relrowsecurity),
  0,
  'T-DB-6 every public table has RLS enabled'
);

-- T-DB-7: no select policy lets app users read the proof bucket.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd in ('SELECT', 'ALL')
      and (qual like '%''proof''%')),
  0,
  'T-DB-7 no select policy on storage.objects for the proof bucket'
);

-- T-DB-7 (Section 18 #31): the only vault select policy is limited to the owner's own folder.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd in ('SELECT', 'ALL')
      and qual like '%''vault''%' and qual not like '%foldername%auth.uid()%'),
  0,
  'T-DB-7 vault select is limited to the owner''s own folder'
);

-- Both buckets are private.
select is(
  (select count(*)::int from storage.buckets where id in ('vault', 'proof') and not public),
  2,
  'vault and proof buckets exist and are private'
);

-- SEC21: app users cannot run the admin and job functions.
select ok(
  not has_function_privilege('authenticated', 'public.admin_verify_request(uuid, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.run_hourly_jobs()', 'execute')
  and not has_function_privilege('anon', 'public.admin_reject_request(uuid, text)', 'execute'),
  'SEC21 admin and job functions are not executable by app users'
);

select * from finish(true); -- raises on any failure, so the run exits non-zero
rollback;
