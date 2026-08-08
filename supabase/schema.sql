-- ============================================================
-- RIXLE WEBSITE — SUPABASE DATABASE SCHEMA
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  company text,
  subject text not null,
  message text not null,
  status text not null default 'New',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- STATUS
-- ------------------------------------------------------------

do $$
begin
  alter table public.contact_submissions
    add column status text not null default 'New';
exception
  when duplicate_column then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_status_chk
    check (status in ('New', 'Contacted', 'Qualified', 'Won', 'Lost'));
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- FIELD LENGTH / FORMAT VALIDATION
-- ------------------------------------------------------------

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_full_name_len_chk
    check (char_length(full_name) between 1 and 200);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_email_len_chk
    check (char_length(email) between 5 and 254);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_email_format_chk
    check (
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_phone_len_chk
    check (char_length(phone) between 1 and 30);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_company_len_chk
    check (company is null or char_length(company) <= 200);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_subject_len_chk
    check (char_length(subject) between 1 and 200);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.contact_submissions
    add constraint contact_submissions_message_len_chk
    check (char_length(message) between 1 and 5000);
exception
  when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);
