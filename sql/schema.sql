-- Run this once in the Neon Console SQL editor for your project, after
-- Neon Auth (Managed Better Auth) and the Data API have been enabled.
-- It never needs to be run by the app itself, and the app never needs
-- DATABASE_URL -- all reads/writes go through the RLS-protected Data API.

create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default auth.user_id(),
  name        text not null check (length(trim(name)) > 0),
  company     text,
  role        text,
  where_met   text,
  notes       text,
  priority    text not null check (priority in ('high', 'medium', 'low')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at current on every edit.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contacts_set_updated_at on contacts;
create trigger contacts_set_updated_at
  before update on contacts
  for each row
  execute function set_updated_at();

-- Row Level Security: enabling it with no policies blocks ALL access.
-- The four policies below restore access, scoped to each user's own rows.
alter table contacts enable row level security;

drop policy if exists contacts_select_own on contacts;
create policy contacts_select_own on contacts
  for select
  to authenticated
  using (auth.user_id() = user_id);

drop policy if exists contacts_insert_own on contacts;
create policy contacts_insert_own on contacts
  for insert
  to authenticated
  with check (auth.user_id() = user_id);

-- UPDATE needs both USING (which existing rows may be touched) and
-- WITH CHECK (what the resulting row must satisfy) -- together these stop
-- a user from reassigning a row to someone else's user_id.
drop policy if exists contacts_update_own on contacts;
create policy contacts_update_own on contacts
  for update
  to authenticated
  using (auth.user_id() = user_id)
  with check (auth.user_id() = user_id);

drop policy if exists contacts_delete_own on contacts;
create policy contacts_delete_own on contacts
  for delete
  to authenticated
  using (auth.user_id() = user_id);

-- Grants required for the Neon Data API's `authenticated` role to reach
-- the table at all -- RLS policies above still gate which rows it can see.
grant usage on schema public to authenticated;
grant select, insert, update, delete on contacts to authenticated;
grant usage, select on all sequences in schema public to authenticated;
