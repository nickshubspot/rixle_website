-- ============================================================
-- RIXLE WEBSITE — CAREERS & JOB APPLICATIONS SCHEMA & RLS
-- ============================================================
-- Run this script in the Supabase SQL Editor.
-- Safe to re-run.

-- 1. Table: public.job_applications
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  position text not null,
  experience text,
  location text,
  linkedin_url text,
  resume_path text not null,
  cover_message text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  constraint job_applications_status_chk check (status in ('New', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired')),
  constraint job_applications_full_name_len_chk check (char_length(full_name) between 1 and 200),
  constraint job_applications_email_len_chk check (char_length(email) between 5 and 254),
  constraint job_applications_email_format_chk check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint job_applications_phone_len_chk check (char_length(phone) between 1 and 30)
);

-- Index for status filtering and sorting
create index if not exists job_applications_status_idx on public.job_applications (status);
create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);

-- 2. Row Level Security for public.job_applications
alter table public.job_applications enable row level security;
alter table public.job_applications force row level security;

-- Drop existing policies if re-running
drop policy if exists "anon_insert_job_applications" on public.job_applications;
drop policy if exists "admin_select_job_applications" on public.job_applications;
drop policy if exists "admin_update_status_job_applications" on public.job_applications;

-- Policy 1: Anonymous candidates can INSERT job applications
create policy "anon_insert_job_applications"
  on public.job_applications
  for insert
  to anon
  with check (true);

-- Policy 2: Authenticated authorized admins can SELECT job applications
create policy "admin_select_job_applications"
  on public.job_applications
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Policy 3: Authenticated authorized admins can UPDATE job application status
create policy "admin_update_status_job_applications"
  on public.job_applications
  for update
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Grant explicit privileges
revoke all on public.job_applications from anon, authenticated, public;
grant insert on public.job_applications to anon;
grant select, update on public.job_applications to authenticated;


-- 3. Storage Bucket: job-applications (Private)
insert into storage.buckets (id, name, public)
values ('job-applications', 'job-applications', false)
on conflict (id) do update set public = false;

-- Storage RLS Policies
drop policy if exists "anon_upload_resume" on storage.objects;
drop policy if exists "admin_select_resume" on storage.objects;

-- Policy for public candidates to upload resumes into 'job-applications' bucket
create policy "anon_upload_resume"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'job-applications');

-- Policy for authorized admins to download/view resumes from 'job-applications' bucket
create policy "admin_select_resume"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'job-applications' and exists (select 1 from public.admins a where a.user_id = auth.uid()));
