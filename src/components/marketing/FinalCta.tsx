'use client';

import React from 'react';

interface FinalCtaProps {
  buyNowUrl?: string;
}

export function FinalCta({ buyNowUrl = 'https://autofocuss.com/checkout/?add-to-cart=57' }: FinalCtaProps) {
  return (
    <section className="wrap pb-24">
      <div className="final-cta rounded-[40px] py-16 sm:py-20 px-6 sm:px-12 text-center text-white bg-radial from-[#16234A] to-[#0B1220] relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-radial from-[#2563EB]/25 via-transparent to-[#00C896]/20 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
            Never lose another 5-star review again.
          </h2>
          <p className="text-[#B7C0D4] text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
            Start capturing reviews and verified phone numbers from walk-in diners at your counter today.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <a href={buyNowUrl} className="btn btn-primary btn-lg text-white">
              Get the D(AI)Y Bundle — <span className="price-now">₹299/outlet</span>
            </a>
            <a
              href="mailto:anirudha@autofocuss.com?subject=Review%20Capture%20Demo"
              className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-[#0B1220]"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
