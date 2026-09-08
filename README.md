# Autofocuss AI Review Capture & Marketing Landing Page

> A unified Next.js (App Router) + TypeScript + Supabase + Tailwind web system that turns walk-in customers at local Indian businesses (restaurants, cafés, salons, clinics, retail, gyms) into 5-star Google reviews and captures verified 10-digit mobile numbers at the counter in under 8 seconds.

---

## Architecture Overview

```
autofocuss-reviews/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Marketing Landing Page (Route: /)
│   │   ├── f/[clientId]/page.tsx      # High-performance Customer Feedback Capture (< 2s on 4G)
│   │   ├── f/[clientId]/not-found.tsx # Branded 404 handler
│   │   ├── admin/page.tsx             # Admin Panel: Client onboarding, QR studio, live feed
│   │   └── api/
│   │       ├── feedback/submit/       # Public submission handler & Make.com webhook dispatcher
│   │       ├── admin/clients/         # Client CRUD endpoint
│   │       ├── admin/export/          # CSV phone list exporter
│   │       └── admin/qr/              # 300+ DPI PNG & Vector SVG QR generator
│   ├── components/
│   │   ├── marketing/                 # Modular, reusable marketing sections taking props
│   │   ├── feedback/                  # High-conversion customer feedback UI primitives
│   │   └── admin/                     # Multi-tenant management & QR download tools
│   └── lib/
│       ├── design-tokens.ts           # Unified design tokens extracted from autofocuss.com/ai
│       ├── validations.ts             # Indian 10-digit mobile & name validation
│       ├── webhook.ts                 # Make.com webhook dispatcher
│       └── qr.ts                      # High-DPI QR generation engine
└── supabase/
    ├── migrations/                    # SQL DDL with Row-Level Security (RLS)
    └── seed.sql                       # Seed data: Tambi, demo sandbox, sample submissions
```

---

## Quick Start (Local Setup)

### 1. Install Dependencies
```bash
cd /Users/anirudhasmac/.gemini/antigravity/scratch/autofocuss-reviews
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: The app includes a built-in repository fallback, allowing full offline development, testing, and UI verification even before connecting live Supabase keys).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Database Migration & Seed (Supabase)

1. Open your Supabase SQL Editor.
2. Run the migration script at `supabase/migrations/20260826000000_init_review_capture_schema.sql`.
3. Run the seed script at `supabase/seed.sql` to populate `tambi`, `demo`, and initial test submissions.

### Row Level Security (RLS) Rules:
- **`clients`**: Public can SELECT active clients only (`status = 'active'`). Authenticated admins have full CRUD.
- **`submissions`**: Public can INSERT valid records matching an active client. Public **CANNOT** read (`SELECT`), update, or delete submissions under any circumstance. Only authenticated admins have read/delete permissions.

---

## Anti-Review Gating Compliance Guarantee

> **CRITICAL COMPLIANCE NOTICE**:
> Google Business Profile policies strictly prohibit "review gating" (filtering who can review or hiding review links from low raters).
> 
> In this codebase:
> - **Every single customer rating (1 to 5 stars) receives a visible, direct Google Review link.**
> - For ratings ≤ 3 (alert threshold): A private apology message is displayed *in addition* to the Google link, and the Make.com webhook alert is triggered for manager follow-up. The Google link is never hidden or conditional.

---

## How to Onboard a New Client in 60 Seconds

1. Navigate to `/admin`.
2. Click **"+ Add New Client"**.
3. Enter:
   - **Client ID**: e.g., `bombay-cafe` (URL slug -> `/f/bombay-cafe`)
   - **Business Name**: e.g., `Bombay Irani Café`
   - **Brand Color**: Hex color code (overrides default tokens on their feedback page)
   - **Google Review URL**: Direct place review link
   - **Owner WhatsApp / Email**: For notifications
   - **Make.com Webhook URL**: (Optional) For automated CRM / WhatsApp alerts
4. Click **"Save Client"**.
5. Click **"📷 QR Code"** next to the client and download:
   - **300+ DPI PNG (2400×2400px)**: Print on acrylic table tents and bill folders.
   - **Vector SVG**: Send to your printing partner / graphic designer.

---

## Deploy to Vercel

1. Push this repository to GitHub / GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy! All routes (`/`, `/f/[clientId]`, `/admin`, and API endpoints) will be live instantly.
