-- T-SETUP-2: pgTAP runs against the linked dev project (Section 18 #23).
begin;
create extension if not exists pgtap with schema extensions;

select plan(1);

select has_schema('public', 'T-SETUP-2 the public schema exists');

select * from finish();
rollback;
