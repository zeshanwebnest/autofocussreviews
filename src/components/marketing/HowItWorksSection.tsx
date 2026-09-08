'use client';

import React from 'react';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Generate Custom QR Stand',
      desc: 'We link your Google Business Profile and create your custom branded QR code.',
    },
    {
      num: '02',
      title: 'Place on Table Tents & Bills',
      desc: 'Print the QR stand for your cash counter, dining tables, or bill folders.',
    },
    {
      num: '03',
      title: 'Customer Scans in 8 Seconds',
      desc: 'Walk-ins tap stars and leave their phone number while settling the bill.',
    },
    {
      num: '04',
      title: 'Reviews Grow Automatically',
      desc: 'Your Google rating climbs higher each week and customer phones sync to your list.',
    },
  ];

  return (
    <section className="sec-pad wrap" id="how">
      <div className="sec-head">
        <span className="eyebrow">How It Works</span>
        <h2>Four simple steps to more reviews.</h2>
        <p>A true setup sequence. Once placed on the counter, it works on autopilot.</p>
      </div>

      <div className="steps-row">
        {steps.map((s, idx) => (
          <div key={idx} className="bg-white border border-[#E6EAF2] rounded-3xl p-6 sm:p-7 shadow-sm">
            <span className="step-num">{s.num}</span>
            <h4 className="text-base font-extrabold text-[#0B1220] mb-2 leading-snug">
              {s.title}
            </h4>
            <p className="text-xs text-[#5B6472] leading-relaxed">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
