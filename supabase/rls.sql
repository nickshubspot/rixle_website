-- =========================================================
-- Rixle Website — Row Level Security Policies
-- Table: public.contact_submissions
-- Run after supabase/schema.sql
--
-- Threat model: the anon key is embedded client-side in
-- assets/js/supabase-client.js, so it is public. Anon must be
-- able to INSERT contact form submissions, and must NOT be able
-- to SELECT, UPDATE, or DELETE any row (no reading other users'
-- submissions, no tampering, no scraping leads).
-- Reads/updates/deletes are intended for the service_role key
-- only (server-side / Supabase dashboard), which bypasses RLS.
-- =========================================================

alter table public.contact_submissions enable row level security;
alter table public.contact_submissions force row level security;

-- Ensure a clean slate if this script is re-run
drop policy if exists "Allow anon insert" on public.contact_submissions;
drop policy if exists "anon_insert_contact_submissions" on public.contact_submissions;
drop policy if exists "Allow anon select" on public.contact_submissions;
drop policy if exists "Allow anon update" on public.contact_submissions;
drop policy if exists "Allow anon delete" on public.contact_submissions;
drop policy if exists "Allow authenticated select" on public.contact_submissions;

-- ---------------------------------------------------------
-- INSERT: anon (public website visitors) may create new
-- contact submissions only. with check(true) allows any row
-- shape permitted by the table's own column constraints
-- (see schema.sql), since anon has no reason to be restricted
-- further at the row level for an insert-only public form.
-- ---------------------------------------------------------
create policy "anon_insert_contact_submissions"
  on public.contact_submissions
  for insert
  to anon
  with check (true);

-- ---------------------------------------------------------
-- No SELECT / UPDATE / DELETE policies exist for anon or
-- authenticated roles. Under RLS, the absence of a policy for
-- an operation means that operation is denied by default —
-- this is intentional and should not be "fixed" by adding
-- broad policies later without a specific, reviewed need.
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- Table-level grants: align privileges with the intent above.
-- RLS policies restrict rows, but GRANT/REVOKE restrict which
-- SQL operations a role may attempt at all. Belt-and-suspenders.
-- ---------------------------------------------------------
revoke all on public.contact_submissions from anon, authenticated, public;
grant insert on public.contact_submissions to anon;
