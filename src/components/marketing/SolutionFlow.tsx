'use client';

import React from 'react';

export function SolutionFlow() {
  const steps = [
    { num: '01', icon: '📷', title: 'QR Scan at Counter', desc: 'Diner scans the table tent while waiting for bill' },
    { num: '02', icon: '★', title: '5-Second Star Tap', desc: '1–5 stars selected with mobile number' },
    { num: '03', icon: '↗', title: 'Happy (4-5★) to Google', desc: '1-tap handoff to post on Google Maps' },
    { num: '04', icon: '🛡', title: 'Unhappy (1-3★) Intercepted', desc: 'Apology & private alert sent to owner' },
    { num: '05', icon: '📲', title: 'Phone Logged to CRM', desc: 'Verified 10-digit number saved automatically' },
  ];

  return (
    <section className="sec-pad bg-[#F5F8FF] rounded-[40px] my-6 sm:my-10">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">The Solution</span>
          <h2>A seamless 8-second counter flow</h2>
          <p>Zero apps to download. Zero friction. Here is exactly how customer reviews are generated automatically.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mt-12">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E6EAF2] rounded-3xl p-6 text-center flex flex-col items-center justify-between shadow-sm hover:shadow-card hover:-translate-y-1 transition-all"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#F5F8FF] border border-[#E6EAF2] flex items-center justify-center text-2xl mb-4 mx-auto shadow-sm">
                  {s.icon}
                </div>
                <span className="text-[11px] font-mono font-bold text-[#2563EB] uppercase tracking-wider block mb-1">
                  Step {s.num}
                </span>
                <h4 className="text-base font-extrabold text-[#0B1220] mb-2 leading-snug">
                  {s.title}
                </h4>
              </div>
              <p className="text-xs text-[#5B6472] leading-relaxed mt-2">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
