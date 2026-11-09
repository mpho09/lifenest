-- T-BR4-2 (Section 18 #33): a 4th invited-or-accepted contact raises limit_contacts;
-- declined and expired contacts do not count. T-BR4-3: you cannot invite yourself.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, raw_user_meta_data)
values ('10000000-0000-0000-0000-000000000001', 'limit.owner@example.com', '{"is_18_or_older": true}');

insert into public.trusted_contacts (owner_id, name, relationship, email) values
  ('10000000-0000-0000-0000-000000000001', 'One', 'Friend', 'one@example.com'),
  ('10000000-0000-0000-0000-000000000001', 'Two', 'Friend', 'two@example.com'),
  ('10000000-0000-0000-0000-000000000001', 'Three', 'Friend', 'three@example.com');

select throws_ok(
  $$ insert into public.trusted_contacts (owner_id, name, relationship, email)
     values ('10000000-0000-0000-0000-000000000001', 'Four', 'Friend', 'four@example.com') $$,
  'limit_contacts',
  'T-BR4-2 the 4th invited contact is refused'
);

update public.trusted_contacts set status = 'declined' where email = 'three@example.com';

select lives_ok(
  $$ insert into public.trusted_contacts (owner_id, name, relationship, email)
     values ('10000000-0000-0000-0000-000000000001', 'Four', 'Friend', 'four@example.com') $$,
  'T-BR4-2 a declined contact does not count towards the limit'
);

select throws_ok(
  $$ update public.trusted_contacts set status = 'invited' where email = 'three@example.com' $$,
  'limit_contacts',
  'T-BR4-2 re-inviting past the limit is refused'
);

select throws_ok(
  $$ insert into public.trusted_contacts (owner_id, name, relationship, email)
     values ('10000000-0000-0000-0000-000000000001', 'Me', 'Self', 'limit.owner@example.com') $$,
  'self_invite',
  'T-BR4-3 inviting your own email is refused'
);

select * from finish(true);
rollback;
