-- leads table for landing page sign-ups
create table if not exists leads (
  id          bigserial    primary key,
  contact_info text        not null,
  created_at  timestamptz  not null default now()
);

-- allow anonymous users (no auth) to insert rows only
alter table leads enable row level security;

drop policy if exists "anon insert" on leads;
create policy "anon insert" on leads
  for insert to anon
  with check (true);
