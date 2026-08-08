-- =========================================================
-- Rixle Website — Supabase Schema
-- Table: contact_submissions
-- Source: assets/js/supabase-client.js (handleContactFormSubmit)
-- Form fields (index.html): fullName, email, phone, company, subject, message
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.contact_submissions (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          text not null,
  phone          text not null,
  company        text,
  subject        text not null,
  message        text not null,
  created_at     timestamptz not null default now()
);

-- Basic sanity constraints
alter table public.contact_submissions
  add constraint contact_submissions_email_format_chk
  check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

alter table public.contact_submissions
  add constraint contact_submissions_full_name_len_chk
  check (char_length(full_name) between 1 and 200);

alter table public.contact_submissions
  add constraint contact_submissions_subject_len_chk
  check (char_length(subject) between 1 and 200);

alter table public.contact_submissions
  add constraint contact_submissions_message_len_chk
  check (char_length(message) between 1 and 5000);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- =========================================================
-- Row Level Security
-- The anon key is embedded client-side in supabase-client.js,
-- so anon must be limited to INSERT only — no read/update/delete.
-- =========================================================

alter table public.contact_submissions enable row level security;

drop policy if exists "Allow anon insert" on public.contact_submissions;
create policy "Allow anon insert"
  on public.contact_submissions
  for insert
  to anon
  with check (true);

-- No select/update/delete policies are defined for anon or authenticated,
-- so those operations remain denied by default under RLS.
-- Reads should go through the service_role key (server-side / dashboard only).
