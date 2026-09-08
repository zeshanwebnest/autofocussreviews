'use client';

import React from 'react';
import { PriceCountdown } from './PriceCountdown';

interface PricingSectionProps {
  bulkPrice?: string;
  buyNowUrl?: string;
}

export function PricingSection({
  bulkPrice = '₹299',
  buyNowUrl = 'https://autofocuss.com/checkout/?add-to-cart=57',
}: PricingSectionProps) {
  return (
    <section className="sec-pad wrap" id="pricing">
      <div className="sec-head">
        <span className="eyebrow">Pricing</span>
        <h2>One bundled service. Simple bulk pricing.</h2>
        <p>Not sold standalone — review automation is bundled into your D(AI)Y service, priced for bulk rollout across outlets.</p>
      </div>

      <div className="flex justify-center">
        <PriceCountdown variant="banner" />
      </div>

      <div className="price-card max-w-[540px] mx-auto rounded-[36px] p-8 sm:p-12 text-white relative overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#141D30] to-[#182238] shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-radial from-[#00C896]/35 to-transparent pointer-events-none" />

        <div className="text-[13px] font-extrabold uppercase tracking-widest text-[#00C896] mb-3">
          D(AI)Y Review Automation Bundle
        </div>

        <div className="text-4xl sm:text-5xl font-black tracking-tight mb-2 flex items-baseline justify-center gap-3">
          <span>{bulkPrice}</span>
          <span className="text-base font-semibold text-[#A8B3C7]">per outlet · bulk deal</span>
        </div>

        <p className="text-sm text-[#00C896] font-bold mb-6">
          Clubbed with the D(AI)Y Review Automation service — unlimited reviews & phone captures included
        </p>

        <ul className="text-left space-y-3 mb-8 text-sm text-[#DCE3F0] font-medium border-t border-b border-white/10 py-6">
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Unlimited QR scans & customer feedback captures
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Direct 1-tap Google Review routing
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Private service-recovery alerts (catch complaints fast)
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Customer phone number capture & CSV export
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Print-ready 300+ DPI custom QR stand design
          </li>
          <li className="flex items-center gap-2.5">
            <span className="text-[#00C896] font-bold">✓</span> Make.com automated webhook integration
          </li>
        </ul>

        <div className="space-y-3">
          <a
            href={buyNowUrl}
            className="btn btn-primary btn-lg w-full text-base font-bold bg-[#00C896] hover:bg-[#00B187] text-[#0B1220] shadow-[0_12px_28px_-10px_rgba(0,200,150,0.55)] border-none"
          >
            Get Started Now
          </a>

          <p className="text-xs text-[#8A93A3] pt-1">
            Need help deciding?{' '}
            <a
              href="mailto:anirudha@autofocuss.com?subject=Review%20Capture%20Inquiry"
              className="text-[#00C896] font-bold hover:underline"
            >
              Talk to us on WhatsApp / Email
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
