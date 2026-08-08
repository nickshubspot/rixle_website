-- =========================================================
-- Rixle Ops Console — Admin authorization & status column
-- Run AFTER supabase/schema.sql and supabase/rls.sql.
-- Safe to re-run.
--
-- Fixes two gaps vs. the original schema.sql/rls.sql:
--   1) contact_submissions has no `status` column — the admin
--      console can't filter/update status without it.
--   2) There is no way for an authenticated admin to read/update
--      leads. This migration does NOT grant that to "any
--      authenticated Supabase account" (using (true)) — it
--      introduces a public.admins allow-list and scopes SELECT/
--      UPDATE on contact_submissions to rows in that table only.
-- =========================================================

-- ---------------------------------------------------------
-- 1) status column
-- ---------------------------------------------------------
alter table public.contact_submissions
  add column if not exists status text not null default 'New';

alter table public.contact_submissions
  drop constraint if exists contact_submissions_status_chk;

alter table public.contact_submissions
  add constraint contact_submissions_status_chk
  check (status in ('New', 'Contacted', 'Qualified', 'Won', 'Lost'));

create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);

-- ---------------------------------------------------------
-- 2) admins allow-list
--
-- A row here means that auth.users.id is an authorized Rixle
-- admin. This table is managed manually via the Supabase
-- dashboard / SQL editor (service_role) — there is deliberately
-- no INSERT/UPDATE/DELETE policy for anon or authenticated, so a
-- logged-in user can never add themselves as an admin from the
-- browser.
-- ---------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admins_self_select" on public.admins;

-- A signed-in user may check ONLY whether their own user_id is
-- present — used by admin-auth.js to gate access to the dashboard.
-- They cannot list other admins.
create policy "admins_self_select"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.admins to authenticated;

-- ---------------------------------------------------------
-- 3) contact_submissions: SELECT/UPDATE scoped to admins only
-- ---------------------------------------------------------
alter table public.contact_submissions enable row level security;

drop policy if exists "authenticated_select_contact_submissions" on public.contact_submissions;
drop policy if exists "authenticated_update_status_contact_submissions" on public.contact_submissions;
drop policy if exists "admin_select_contact_submissions" on public.contact_submissions;
drop policy if exists "admin_update_status_contact_submissions" on public.contact_submissions;

create policy "admin_select_contact_submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "admin_update_status_contact_submissions"
  on public.contact_submissions
  for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

grant select, update on public.contact_submissions to authenticated;

-- ---------------------------------------------------------
-- Manual step (cannot be scripted without knowing the user's
-- auth.users.id in advance): after creating the admin's login in
-- Supabase Auth, add them to the allow-list:
--
--   insert into public.admins (user_id)
--   values ('<the admin''s auth.users.id, from the Auth tab>');
-- ---------------------------------------------------------
