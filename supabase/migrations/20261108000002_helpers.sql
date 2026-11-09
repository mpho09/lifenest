-- 0002 Permission helpers (Section 8.6). Security definer so they can be used
-- inside RLS policies without recursion; each only answers yes/no.

create or replace function public.is_accepted_contact(owner uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.trusted_contacts tc
    where tc.owner_id = owner and tc.contact_user_id = viewer and tc.status = 'accepted'
  );
$$;

create or replace function public.contact_level(owner uuid, viewer uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select tc.access_level from public.trusted_contacts tc
  where tc.owner_id = owner and tc.contact_user_id = viewer and tc.status = 'accepted'
  limit 1;
$$;

create or replace function public.is_released(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users u where u.id = owner and u.vault_status = 'released');
$$;

-- BR5: true only when the vault is released and the viewer's level allows the section.
-- `section` is a BR2 category or 'instructions'.
create or replace function public.can_see_section(owner uuid, viewer uuid, section text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_released(owner) and exists (
    select 1 from public.trusted_contacts tc
    where tc.owner_id = owner
      and tc.contact_user_id = viewer
      and tc.status = 'accepted'
      and (tc.access_level = 'full'
           or (tc.access_level = 'selected' and section = any (tc.allowed_sections)))
  );
$$;

-- Email of the signed-in user, from our users table (always lower-case).
create or replace function public.my_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email from public.users u where u.id = auth.uid();
$$;
