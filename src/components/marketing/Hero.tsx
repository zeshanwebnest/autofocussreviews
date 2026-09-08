'use client';

import React, { useState } from 'react';
import { PriceCountdown } from './PriceCountdown';

interface HeroProps {
  eyebrow?: string;
  headline?: React.ReactNode;
  subcopy?: string;
  buyNowUrl?: string;
}

export function Hero({
  eyebrow = 'AI-POWERED REVIEW GENERATION & CUSTOMER CAPTURE',
  headline = (
    <>
      Turn walk-in customers into <span className="accent">5-star Google reviews.</span>
    </>
  ),
  subcopy = 'Place a smart QR stand at your billing counter. Happy customers are routed straight to Google Reviews in 8 seconds, while unhappy feedback reaches you privately — and you capture every customer phone number automatically.',
  buyNowUrl = '#pricing',
}: HeroProps) {
  const [activeIndustry, setActiveIndustry] = useState<string>('Restaurants');

  const industries = ['Restaurants', 'Cafés', 'Salons', 'Clinics', 'Retail', 'Gyms'];

  return (
    <header className="hero pt-14 sm:pt-20 pb-12 sm:pb-16 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-[-100px] right-[-150px] w-[600px] h-[600px] bg-radial from-[#2563EB]/10 via-[#00C896]/5 to-transparent rounded-full pointer-events-none -z-10" />

      <div className="wrap grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
        {/* Left Column: Copy & CTAs */}
        <div>
          <span className="badge">
            <span className="dot"></span>
            {eyebrow}
          </span>

          <h1 className="headline">
            {headline}
          </h1>

          <p className="sub">
            {subcopy}
          </p>

          <div className="hero-ctas flex flex-wrap gap-3.5 mb-7">
            <a href={buyNowUrl} className="btn btn-primary btn-lg text-white">
              Get the D(AI)Y Bundle — <span className="price-now">₹299/outlet</span>
            </a>
            <a href="#how" className="btn btn-outline btn-lg">
              See How It Works
            </a>
          </div>

          <p className="hero-note text-[13px] text-[#8A93A3] font-semibold mb-3">
            Bundled with <span className="mono text-[#00C896] font-bold">D(AI)Y Review Automation</span> · Bulk pricing for multi-outlet businesses
          </p>

          <div className="mb-8">
            <PriceCountdown variant="compact" />
          </div>

          {/* Industry Pills */}
          <div className="industry-row flex flex-wrap gap-2 pt-2 border-t border-[#E6EAF2]">
            {industries.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => setActiveIndustry(ind)}
                className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition-all cursor-pointer ${
                  activeIndustry === ind
                    ? 'bg-[#0B1220] text-white border-[#0B1220]'
                    : 'bg-white text-[#5B6472] border-[#E6EAF2] hover:border-[#0B1220]'
                }`}
              >
                {ind}
              </button>
            ))}
          </div>

          <div className="stat-row flex flex-wrap items-center gap-6 mt-5 text-[13.5px] text-[#5B6472] font-semibold">
            <span><b className="text-[#0B1220]">TARGET AUDIENCE:</b> Local & Multi-Location Businesses</span>
            <span>Avg Scan-to-Review Time: <span className="text-[#00C896] font-extrabold">&lt; 8 seconds</span></span>
          </div>
        </div>

        {/* Right Column: Live Animated Flow Panel */}
        <div className="flow-panel">
          <div className="flow-line"></div>
          
          <div className="flow-card fc1 animate-float-1">
            <div className="ic">★</div>
            <div className="txt">
              <b>Incoming Review</b>
              <span>5-star · &quot;Best filter coffee in town!&quot;</span>
            </div>
          </div>

          <div className="flow-card fc2 animate-float-2">
            <div className="ic">📱</div>
            <div className="txt">
              <b>Phone Number Captured</b>
              <span>+91 98200 12345 · Saved to CRM</span>
            </div>
          </div>

          <div className="flow-card fc3 animate-float-3">
            <div className="ic">↗</div>
            <div className="txt">
              <b>Routed to Google Maps</b>
              <span>1-tap review posted automatically</span>
            </div>
          </div>

          <div className="flow-card fc4 animate-float-4">
            <div className="ic">🛡</div>
            <div className="txt">
              <b>Service Recovery Shield</b>
              <span>Low rating alerted to owner privately</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
