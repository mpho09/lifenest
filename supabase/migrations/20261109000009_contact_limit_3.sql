-- 0009 BR4 changed by the human (Section 18 #33): at most 3 trusted contacts
-- that are invited or accepted. Only the limit changes.
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
          where tc.owner_id = new.owner_id and tc.status in ('invited', 'accepted') and tc.id <> new.id) >= 3 then
    raise exception 'limit_contacts';
  end if;
  if new.access_level <> 'selected' then
    new.allowed_sections := '{}';
  end if;
  return new;
end;
$$;
