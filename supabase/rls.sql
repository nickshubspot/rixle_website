-- Rixle contact_submissions Row Level Security
-- Public website:
--   anon: INSERT only
--   anon: SELECT/UPDATE/DELETE: denied
--
-- Admin/server-side access:
--   handled separately by authenticated/admin policies
--   or service_role, which bypasses RLS.

ALTER TABLE public.contact_submissions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contact_submissions
  FORCE ROW LEVEL SECURITY;


-- Remove old/conflicting policies if this script is re-run.
DROP POLICY IF EXISTS "Allow anon insert"
  ON public.contact_submissions;

DROP POLICY IF EXISTS "anon_insert_contact_submissions"
  ON public.contact_submissions;

DROP POLICY IF EXISTS "Allow anon select"
  ON public.contact_submissions;

DROP POLICY IF EXISTS "Allow anon update"
  ON public.contact_submissions;

DROP POLICY IF EXISTS "Allow anon delete"
  ON public.contact_submissions;

DROP POLICY IF EXISTS "Allow authenticated select"
  ON public.contact_submissions;


-- Public contact form:
-- Anonymous website visitors can create submissions.
CREATE POLICY "anon_insert_contact_submissions"
ON public.contact_submissions
FOR INSERT
TO anon
WITH CHECK (true);


-- Explicit table privileges.
-- Remove all existing privileges from public-facing roles.
REVOKE ALL
ON public.contact_submissions
FROM anon, authenticated, public;


-- Allow anonymous users to submit contact forms.
GRANT INSERT
ON public.contact_submissions
TO anon;
