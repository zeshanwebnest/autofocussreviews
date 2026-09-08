'use client';

import React, { useState } from 'react';

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: 'Does this comply with Google review policies?',
    a: 'Yes, 100%. Google prohibits "review gating" (filtering who can review). In our system, all customers at every star rating have clear, direct access to the public Google Review link. For low ratings (1-3 stars), we additionally provide a private apology and alert the business owner so you can resolve the issue immediately.',
  },
  {
    q: 'Do customers need to download any application?',
    a: 'No. The customer simply opens their phone camera, points it at your counter QR stand, and the rapid web page loads in under 2 seconds. No app install, no logins, no friction.',
  },
  {
    q: 'How are customer phone numbers validated?',
    a: 'Every submission verifies a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9). Invalid numbers or blank inputs are rejected immediately on the phone.',
  },
  {
    q: 'Do I need a special POS machine or new hardware?',
    a: 'No hardware needed at all. You only need the printed QR stand placed at your billing counter or table tent.',
  },
  {
    q: 'How fast can our outlet go live?',
    a: 'We generate your custom branded QR link and dashboard within 24 hours. You can print the stand immediately and start collecting reviews the very same day.',
  },
  {
    q: 'How are payments handled?',
    a: 'All transactions are securely processed through Cashfree, a certified PCI DSS compliant payment gateway. We never store your card or banking details.',
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="sec-pad wrap" id="faq">
      <div className="sec-head">
        <span className="eyebrow">FAQ</span>
        <h2>Questions, answered.</h2>
        <p>Everything you need to know about setting up review capture for your business.</p>
      </div>

      <div className="max-w-[760px] mx-auto divide-y divide-[#E6EAF2]">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              className="py-5 cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-base sm:text-lg font-bold text-[#0B1220] group-hover:text-[#2563EB] transition-colors">
                  {faq.q}
                </h4>
                <span className={`text-xl font-light text-[#8A93A3] transition-transform duration-200 ${isOpen ? 'rotate-45 text-[#2563EB]' : ''}`}>
                  +
                </span>
              </div>
              {isOpen && (
                <p className="text-xs sm:text-sm text-[#5B6472] leading-relaxed pt-3.5 max-w-[660px] animate-in fade-in">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
