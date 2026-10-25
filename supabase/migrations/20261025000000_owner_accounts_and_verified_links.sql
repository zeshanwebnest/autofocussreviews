-- Migration: 20261025000000_owner_accounts_and_verified_links.sql
--
-- Adds, additively:
--   * a verified flag + audit trail on each shop's Google review link
--   * owner-account lifecycle fields (disable/revoke, invitation tracking)
--   * a constraint enforcing one owner account per shop
--
-- No existing row is deleted or rewritten. Every current Google link is left
-- marked UNVERIFIED on purpose: none has been confirmed against the real
-- business listing, and the shared test link must not be treated as verified.

-- ---------------------------------------------------------------------------
-- 1. clients — Google review link provenance
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS google_review_url_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS google_review_url_updated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS google_review_url_updated_by UUID
        REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.clients.google_review_url_verified IS
    'TRUE only once a human has confirmed this URL opens the correct business listing.';

-- ---------------------------------------------------------------------------
-- 2. profiles — owner account lifecycle
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS disabled         BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS invited_at       TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.disabled IS
    'Revokes access without deleting the account or its history. Checked by the application guards.';

-- One owner account per shop. Admins (client_id IS NULL) are unaffected, and
-- the partial index leaves shops with no owner perfectly valid.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_one_owner_per_shop
    ON public.profiles (client_id)
    WHERE role = 'owner' AND client_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Row level security
-- ---------------------------------------------------------------------------
-- Owners may already SELECT their own shop row (policy "Owners read only their
-- own shop" from the previous migration). They are deliberately NOT granted
-- UPDATE here: Postgres row policies cannot restrict WHICH columns are written,
-- so an UPDATE policy would also let an owner change alert_threshold, status or
-- webhook_url. Owner edits to the Google link therefore go through the server,
-- which writes that single column and nothing else.
--
-- Nothing to add for clients.

-- A disabled profile must stop being useful immediately. The application guards
-- are the primary check; this keeps the database consistent with them.
DROP POLICY IF EXISTS "Owners read only their own shop submissions" ON public.submissions;
CREATE POLICY "Owners read only their own shop submissions"
ON public.submissions FOR SELECT TO authenticated
USING (
    client_id = public.auth_client_id()
    AND public.auth_client_id() <> ''
    AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.disabled
    )
);

DROP POLICY IF EXISTS "Owners read only their own shop" ON public.clients;
CREATE POLICY "Owners read only their own shop"
ON public.clients FOR SELECT TO authenticated
USING (
    id = public.auth_client_id()
    AND public.auth_client_id() <> ''
    AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.disabled
    )
);

-- ---------------------------------------------------------------------------
-- 4. Backfill
-- ---------------------------------------------------------------------------
-- Record when each existing link was last touched, without claiming it is
-- verified. Existing admins stay enabled.
UPDATE public.clients
SET google_review_url_updated_at = COALESCE(google_review_url_updated_at, created_at)
WHERE google_review_url IS NOT NULL
  AND google_review_url_updated_at IS NULL;
