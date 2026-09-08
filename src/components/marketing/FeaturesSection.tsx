'use client';

import React from 'react';

export function FeaturesSection() {
  const features = [
    {
      icon: '⚡',
      title: 'One-Tap 5-Star Rating',
      desc: 'Customers can rate your outlet in 5 seconds without installing any application or logging in.',
    },
    {
      icon: '📍',
      title: 'Direct Google Review Handoff',
      desc: 'Pre-opens the Google write-review box so happy diners can submit their review with one tap.',
    },
    {
      icon: '🛡',
      title: 'Private Service Recovery',
      desc: 'Unhappy feedback is captured privately and alerted to the owner instantly before it hits Google Maps.',
    },
    {
      icon: '📱',
      title: 'Verified 10-Digit Mobile Capture',
      desc: 'Validates Indian mobile numbers on the fly, building a valuable customer list for festival marketing.',
    },
    {
      icon: '🖨',
      title: '300 DPI Print-Ready QR Stands',
      desc: 'Download high-resolution vector and PNG files designed to fit standard billing stands and table tents.',
    },
  ];

  return (
    <section className="sec-pad wrap" id="features">
      <div className="sec-head">
        <span className="eyebrow">Features</span>
        <h2>Everything you need. Nothing you have to manage.</h2>
        <p>Set it up once at your billing counter — the system runs on autopilot 24/7.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-white border border-[#E6EAF2] rounded-3xl p-7 hover:border-transparent hover:shadow-card hover:-translate-y-1 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F5F8FF] flex items-center justify-center text-xl mb-4.5">
              {f.icon}
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-[#0B1220] mb-2">
              {f.title}
            </h4>
            <p className="text-xs sm:text-sm text-[#5B6472] leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
