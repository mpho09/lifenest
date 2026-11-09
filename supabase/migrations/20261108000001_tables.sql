-- 0001 Tables, constraints and indexes (IMPLEMENTATION_PLAN Section 8.1–8.4)

-- BR2 categories, used by documents, assets, instruction sections and allowed_sections.
create or replace function public.is_category(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value in ('identity', 'insurance', 'property', 'vehicles', 'banking_investments',
                   'debts_accounts', 'medical', 'business', 'other');
$$;

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(email)),
  full_name text check (char_length(full_name) between 2 and 80),
  phone text check (phone ~ '^(\+27|0)[0-9]{9}$'),
  is_18_or_older boolean not null default false check (is_18_or_older),
  owns_no_property_or_vehicle boolean not null default false,
  last_reviewed_at timestamptz not null default now(),
  vault_status text not null default 'normal'
    check (vault_status in ('normal', 'request_open', 'released')),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  category text not null check (public.is_category(category)),
  file_path text not null,
  file_type text not null check (file_type in ('pdf', 'jpg', 'png')),
  size_kb integer not null check (size_kb between 1 and 10240),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  category text not null check (public.is_category(category)),
  type text not null check (type in ('property', 'vehicle', 'policy', 'bank_account', 'card',
                                     'investment', 'debt', 'recurring_payment', 'other')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  provider text check (char_length(provider) <= 80),
  provider_phone text check (char_length(provider_phone) <= 15),
  reference_number text check (char_length(reference_number) <= 30),
  last4 text check (last4 ~ '^[0-9]{4}$'),
  originals_location text check (char_length(originals_location) <= 200),
  notes text check (char_length(notes) <= 500),
  -- BR12: how many linked documents were deleted since the asset was last saved.
  deleted_document_count integer not null default 0 check (deleted_document_count >= 0),
  created_at timestamptz not null default now(),
  -- BR3: full numbers are never stored for bank accounts and cards.
  constraint assets_reference_not_for_accounts
    check (reference_number is null or type not in ('bank_account', 'card')),
  constraint assets_last4_only_for_accounts
    check (last4 is null or type in ('bank_account', 'card'))
);

create table public.asset_documents (
  asset_id uuid not null references public.assets (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  primary key (asset_id, document_id)
);

create table public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  contact_user_id uuid references public.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  relationship text not null check (char_length(btrim(relationship)) between 1 and 40),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone ~ '^(\+27|0)[0-9]{9}$'),
  access_level text not null default 'selected' check (access_level in ('emergency', 'selected', 'full')),
  allowed_sections text[] not null default '{}'
    check (allowed_sections <@ array['identity', 'insurance', 'property', 'vehicles', 'banking_investments',
                                     'debts_accounts', 'medical', 'business', 'other', 'instructions']::text[]),
  status text not null default 'invited' check (status in ('invited', 'accepted', 'declined', 'expired')),
  invite_token uuid not null default gen_random_uuid() unique,
  invite_expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);

create table public.instructions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.users (id) on delete cascade,
  kind text not null check (kind in ('instruction', 'message')),
  section text check (section is null or section = 'general' or public.is_category(section)),
  recipient_id uuid references public.trusted_contacts (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructions_kind_fields check (
    (kind = 'instruction' and section is not null and recipient_id is null)
    or (kind = 'message' and recipient_id is not null and section is null)
  )
);

-- Checks an emergency_contacts array: at most 3 objects with a name.
create or replace function public.valid_emergency_contacts(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'array'
     and jsonb_array_length(value) <= 3
     and not exists (
       select 1 from jsonb_array_elements(value) as c
       where jsonb_typeof(c) <> 'object'
          or char_length(coalesce(c ->> 'name', '')) not between 1 and 80
          or char_length(coalesce(c ->> 'relationship', '')) > 40
          or char_length(coalesce(c ->> 'phone', '')) > 15
     );
$$;

create table public.emergency_profiles (
  owner_id uuid primary key default auth.uid() references public.users (id) on delete cascade,
  emergency_contacts jsonb not null default '[]'::jsonb
    check (public.valid_emergency_contacts(emergency_contacts)),
  medical_aid_provider text check (char_length(medical_aid_provider) <= 80),
  medical_aid_number text check (char_length(medical_aid_number) <= 30),
  key_notes text check (char_length(key_notes) <= 500),
  share_now boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  contact_id uuid references public.trusted_contacts (id) on delete set null,
  requester_id uuid references public.users (id) on delete set null,
  reason text not null check (reason in ('death', 'incapacity')),
  proof_path text not null,
  requester_id_path text not null,
  declaration_ticked boolean not null check (declaration_ticked),
  status text not null default 'submitted'
    check (status in ('submitted', 'verified', 'rejected', 'cancelled', 'released', 'revoked')),
  submitted_at timestamptz not null default now(),
  waiting_ends_at timestamptz not null default now() + interval '7 days',
  verified_at timestamptz,
  released_at timestamptz,
  closed_at timestamptz,
  reminder_sent_at timestamptz,
  admin_note text check (char_length(admin_note) <= 300)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null references public.users (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  action text not null check (action in ('invite_sent', 'invite_accepted', 'invite_declined',
    'request_submitted', 'request_verified', 'request_rejected', 'request_cancelled',
    'released', 'revoked', 'viewed', 'downloaded', 'contact_removed')),
  item_id uuid,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.users (id) on delete cascade,
  recipient_email text,
  type text not null check (type in ('invite_sent', 'invite_accepted', 'request_submitted',
    'request_reminder', 'request_cancelled', 'request_rejected', 'vault_released',
    'release_revoked', 'review_due', 'contact_removed')),
  text text not null check (char_length(text) <= 200),
  link_target text,
  is_read boolean not null default false,
  email_status text not null default 'none' check (email_status in ('none', 'pending', 'sent', 'failed')),
  email_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  constraint notifications_has_recipient check (recipient_id is not null or recipient_email is not null)
);

-- 8.4 Indexes
create index documents_owner_category_idx on public.documents (owner_id, category, created_at desc);
create index documents_owner_title_idx on public.documents (owner_id, lower(title) text_pattern_ops);
create index assets_owner_category_idx on public.assets (owner_id, category);
create index asset_documents_document_idx on public.asset_documents (document_id);
create index trusted_contacts_owner_idx on public.trusted_contacts (owner_id);
create index trusted_contacts_contact_user_idx on public.trusted_contacts (contact_user_id);
create index trusted_contacts_email_idx on public.trusted_contacts (lower(email));
create index instructions_owner_kind_idx on public.instructions (owner_id, kind);
create index instructions_recipient_idx on public.instructions (recipient_id);
create unique index access_requests_one_open_idx on public.access_requests (owner_id)
  where status in ('submitted', 'verified');
create index access_requests_status_waiting_idx on public.access_requests (status, waiting_ends_at);
create index access_requests_requester_idx on public.access_requests (requester_id);
create index audit_log_owner_idx on public.audit_log (owner_id, created_at desc);
create index notifications_recipient_idx on public.notifications (recipient_id, is_read, created_at desc);
create index notifications_pending_email_idx on public.notifications (email_status) where email_status = 'pending';
