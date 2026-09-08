-- Migration: 20260826000000_init_review_capture_schema.sql
-- Description: Sets up clients and submissions tables with Row Level Security (RLS)

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    logo_url TEXT,
    brand_colour TEXT NOT NULL DEFAULT '#2563EB',
    google_review_url TEXT NOT NULL,
    owner_whatsapp TEXT,
    owner_email TEXT,
    alert_threshold INTEGER NOT NULL DEFAULT 3,
    webhook_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    location_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    source TEXT NOT NULL DEFAULT 'qr',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON public.submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

-- 4. Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: CLIENTS
-- Public (anonymous) can read active clients
CREATE POLICY "Public clients are viewable by everyone" 
ON public.clients FOR SELECT 
TO anon, authenticated 
USING (status = 'active');

-- Authenticated admins can manage clients
CREATE POLICY "Admins have full CRUD on clients" 
ON public.clients FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 6. RLS Policies: SUBMISSIONS
-- Public (anonymous) can insert submissions for active clients
CREATE POLICY "Public can insert submissions" 
ON public.submissions FOR INSERT 
TO anon, authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.clients 
        WHERE clients.id = submissions.client_id 
        AND clients.status = 'active'
    )
);

-- Anonymous users cannot read submissions
-- Only authenticated users (admins) can view submissions
CREATE POLICY "Only authenticated admins can view submissions" 
ON public.submissions FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated admins can delete submissions
CREATE POLICY "Only authenticated admins can delete submissions" 
ON public.submissions FOR DELETE 
TO authenticated 
USING (true);
