-- Migration: 20261021000000_roles_and_email_alerts.sql
-- Adds: role-based access (central admin vs shop owner),
--       configurable email notification recipients (global + per shop),
--       an email delivery log used for de-duplication and troubleshooting.
--
-- Safe to re-run. No existing rows are modified except where noted in step 7
-- (existing auth users are backfilled as central admins).
--
-- IMPORTANT: step 6 REPLACES three policies created by the initial migration.
-- Those policies granted every authenticated user full access, which would have
-- let a shop owner read every other shop's customers.

-- ---------------------------------------------------------------------------
-- 1. Helper functions — read role + shop from the signed JWT
-- ---------------------------------------------------------------------------
-- Reading from the JWT (rather than querying profiles) keeps policies cheap and
-- avoids recursive policy evaluation. app_metadata is server-controlled: a user
-- cannot edit their own claims.

CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.auth_client_id()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'client_id', '');
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT public.auth_role() = 'admin';
$$;

-- ---------------------------------------------------------------------------
-- 2. profiles — maps an auth user to a role and, for owners, to one shop
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      TEXT,
    full_name  TEXT,
    role       TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
    -- NULL for admins. For owners, NULL means "assigned to no shop yet" and
    -- therefore no access to anything — it fails closed on purpose.
    client_id  TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON public.profiles(role);

-- ---------------------------------------------------------------------------
-- 3. notification_settings — who receives negative-review alerts
-- ---------------------------------------------------------------------------
-- One 'global' row (central admin) plus at most one 'client' row per shop.
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope           TEXT NOT NULL CHECK (scope IN ('global', 'client')),
    client_id       TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    recipient_email TEXT,
    cc_emails       TEXT[] NOT NULL DEFAULT '{}',
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT notification_scope_shape CHECK (
        (scope = 'global' AND client_id IS NULL) OR
        (scope = 'client' AND client_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_global_uniq
    ON public.notification_settings (scope) WHERE scope = 'global';
CREATE UNIQUE INDEX IF NOT EXISTS notification_settings_client_uniq
    ON public.notification_settings (client_id) WHERE scope = 'client';

-- ---------------------------------------------------------------------------
-- 4. email_log — delivery record, de-duplication, troubleshooting
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
    client_id     TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
    kind          TEXT NOT NULL DEFAULT 'negative_review',
    recipients    TEXT[] NOT NULL DEFAULT '{}',
    cc            TEXT[] NOT NULL DEFAULT '{}',
    subject       TEXT,
    status        TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
    provider_id   TEXT,
    error         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A submission can only ever be alerted on ONCE successfully. Failed and
-- skipped attempts are still recorded, and may be retried.
CREATE UNIQUE INDEX IF NOT EXISTS email_log_sent_once
    ON public.email_log (submission_id, kind) WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_email_log_client_id  ON public.email_log(client_id);
CREATE INDEX IF NOT EXISTS idx_email_log_created_at ON public.email_log(created_at DESC);

-- ---------------------------------------------------------------------------
-- 5. Enable RLS on the new tables
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log             ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. Replace the over-permissive policies from the initial migration
-- ---------------------------------------------------------------------------
-- These three previously used USING (true) for ANY authenticated user.
DROP POLICY IF EXISTS "Only authenticated admins can view submissions"   ON public.submissions;
DROP POLICY IF EXISTS "Only authenticated admins can delete submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins have full CRUD on clients"                 ON public.clients;

-- SUBMISSIONS ---------------------------------------------------------------
-- Public insert policy from the initial migration is intentionally left as-is.
CREATE POLICY "Admins read all submissions"
ON public.submissions FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Owners read only their own shop submissions"
ON public.submissions FOR SELECT TO authenticated
USING (client_id = public.auth_client_id() AND public.auth_client_id() <> '');

CREATE POLICY "Admins delete submissions"
ON public.submissions FOR DELETE TO authenticated
USING (public.is_admin());

-- CLIENTS -------------------------------------------------------------------
-- The initial migration's public policy granted SELECT to anon AND
-- authenticated. Because policies are OR'd together, that would have let every
-- signed-in shop owner read every other shop's row — including owner_email and
-- webhook_url — no matter what the owner policy below says. Re-create it for
-- anon only. Server-rendered pages use the service role and are unaffected.
DROP POLICY IF EXISTS "Public clients are viewable by everyone" ON public.clients;

CREATE POLICY "Anonymous visitors can read active shops"
ON public.clients FOR SELECT TO anon
USING (status = 'active');
CREATE POLICY "Admins manage all clients"
ON public.clients FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Owners read only their own shop"
ON public.clients FOR SELECT TO authenticated
USING (id = public.auth_client_id() AND public.auth_client_id() <> '');

-- PROFILES ------------------------------------------------------------------
CREATE POLICY "Users read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- NOTIFICATION SETTINGS -----------------------------------------------------
CREATE POLICY "Admins manage all notification settings"
ON public.notification_settings FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Owners read their own shop notification settings"
ON public.notification_settings FOR SELECT TO authenticated
USING (scope = 'client' AND client_id = public.auth_client_id() AND public.auth_client_id() <> '');

CREATE POLICY "Owners update their own shop notification settings"
ON public.notification_settings FOR UPDATE TO authenticated
USING (scope = 'client' AND client_id = public.auth_client_id() AND public.auth_client_id() <> '')
WITH CHECK (scope = 'client' AND client_id = public.auth_client_id() AND public.auth_client_id() <> '');

CREATE POLICY "Owners create their own shop notification settings"
ON public.notification_settings FOR INSERT TO authenticated
WITH CHECK (scope = 'client' AND client_id = public.auth_client_id() AND public.auth_client_id() <> '');

-- EMAIL LOG -----------------------------------------------------------------
CREATE POLICY "Admins read all email log"
ON public.email_log FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Owners read their own shop email log"
ON public.email_log FOR SELECT TO authenticated
USING (client_id = public.auth_client_id() AND public.auth_client_id() <> '');

-- ---------------------------------------------------------------------------
-- 7. Backfill — every existing auth user becomes a central admin
-- ---------------------------------------------------------------------------
-- There are only administrator accounts today, so this preserves current
-- behaviour exactly. New shop owners are created through the admin panel.
INSERT INTO public.profiles (id, email, role, client_id)
SELECT u.id, u.email, 'admin', NULL
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Seed the single global notification row (recipient filled in from the UI).
INSERT INTO public.notification_settings (scope, client_id, recipient_email, cc_emails, enabled)
SELECT 'global', NULL, NULL, '{}', TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_settings WHERE scope = 'global'
);

-- Give every existing shop an (empty, disabled-by-default-recipient) row so the
-- owner UI always has something to edit.
INSERT INTO public.notification_settings (scope, client_id, recipient_email, cc_emails, enabled)
SELECT 'client', c.id, c.owner_email, '{}', TRUE
FROM public.clients c
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_settings ns
    WHERE ns.scope = 'client' AND ns.client_id = c.id
);
