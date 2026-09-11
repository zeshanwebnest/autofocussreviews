'use client';

import React from 'react';
import { CustomerFeedbackFlow } from '@/components/feedback/CustomerFeedbackFlow';
import { Client } from '@/types/app.types';

// Only used if the 'demo' business cannot be read from the database.
const fallbackDemoClient: Client = {
  id: 'demo',
  business_name: 'Demo Café & Kitchen',
  logo_url: null,
  brand_colour: '#2563EB',
  google_review_url: 'https://g.page/r/CS7_SFlSItxZEBM/review',
  owner_whatsapp: '+919999999999',
  owner_email: 'demo@autofocuss.com',
  alert_threshold: 3,
  webhook_url: null,
  status: 'active',
  location_id: null,
  created_at: new Date().toISOString(),
};

interface LiveDemoSectionProps {
  /** The 'demo' business, loaded from the database by the page. */
  demoClient?: Client | null;
}

export function LiveDemoSection({ demoClient }: LiveDemoSectionProps) {
  const client = demoClient ?? fallbackDemoClient;

  return (
    <section id="demo" className="sec-pad bg-[#F5F8FF] rounded-[40px] my-10">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Interactive Live Demo</span>
          <h2>Try it yourself right now.</h2>
          <p>
            Tap a star rating below to see the exact 5-second experience your customers will get at the billing counter.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white border border-[#E6EAF2] rounded-3xl p-6 sm:p-8 shadow-card">
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF5] text-[#00C896] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#00C896]" />
            LIVE DEMO
          </div>

          <CustomerFeedbackFlow client={client} />
        </div>

        <p className="text-center text-xs text-[#8A93A3] mt-6 font-medium">
          Note: This demo is connected to the live system. Ratings submitted here are saved against the
          &ldquo;{client.business_name}&rdquo; demo business, so you can watch them appear in the dashboard.
        </p>
      </div>
    </section>
  );
}
