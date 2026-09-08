'use client';

import React from 'react';

/**
 * The Cost of Doing Nothing Section
 * Built as a distinct, visually weightier section featuring the three mandatory questions
 * grounded in real-world local Indian business outcomes.
 */
export function CostOfDoingNothing() {
  return (
    <section id="cost" className="sec-pad bg-[#0B1220] text-white my-8 sm:my-14 rounded-[36px] sm:rounded-[44px] overflow-hidden relative">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2563EB]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#00C896]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="wrap relative z-10">
        <div className="sec-head max-w-[700px] text-center mb-14">
          <span className="inline-block text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-[#00C896] mb-3">
            The Reality Check
          </span>
          <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight mb-4">
            The True Cost of Doing Nothing
          </h2>
          <p className="text-[#A8B3C7] text-base sm:text-lg leading-relaxed">
            Every day you delay setting up a review capture system at your counter is a day of lost footfall and missed customer data. Ask yourself these three questions:
          </p>
        </div>

        {/* 3 Weighted Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Question 1 */}
          <div className="bg-[#141D30] border border-white/10 rounded-3xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#2563EB]/50 transition-all hover:bg-[#18233A]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#2563EB]/20 text-[#60A5FA] font-mono text-xs font-bold mb-4">
                QUESTION 01
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-4">
                What happens if nothing changes in the next six months and you&apos;re having this same conversation again?
              </h3>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-xs sm:text-sm text-[#B7C0D4] leading-relaxed">
                Your rating stays stuck at 3.9 while the café or salon two streets away climbs to 4.7 stars with 400 fresh reviews. New locals searching &ldquo;best filter coffee near me&rdquo; walk straight past your door into theirs.
              </p>
            </div>
          </div>

          {/* Question 2 */}
          <div className="bg-[#141D30] border border-white/10 rounded-3xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#00C896]/50 transition-all hover:bg-[#18233A]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#00C896]/20 text-[#00C896] font-mono text-xs font-bold mb-4">
                QUESTION 02
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-4">
                What changes for your business if you keep doing what you&apos;re doing right now?
              </h3>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-xs sm:text-sm text-[#B7C0D4] leading-relaxed">
                Nothing improves. 90% of your happy walk-in customers keep leaving without rating. Meanwhile, the one customer whose order took 15 minutes posts an unanswered 1-star rant that damages your reputation forever.
              </p>
            </div>
          </div>

          {/* Question 3 */}
          <div className="bg-[#141D30] border border-white/10 rounded-3xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#FF4D8D]/50 transition-all hover:bg-[#18233A]">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#FF4D8D]/20 text-[#FF4D8D] font-mono text-xs font-bold mb-4">
                QUESTION 03
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug mb-4">
                What&apos;s the worst-case scenario — the maximum cost of wasting the next three to six months before you decide to move forward?
              </h3>
            </div>
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-xs sm:text-sm text-[#B7C0D4] leading-relaxed">
                You lose over 2,000 verified customer phone numbers you could have re-engaged via WhatsApp, suffer a dozen unintercepted public complaints, and miss out on ₹3–5 Lakhs in repeat revenue from lost footfall.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
