'use client';

import React from 'react';

export function ProblemSection() {
  return (
    <section className="sec-pad wrap">
      <div className="sec-head">
        <span className="eyebrow">The Problem</span>
        <h2>Why most local businesses struggle with Google reviews</h2>
        <p>You serve hundreds of happy customers every week. But almost none of them post a review — while an angry customer never forgets.</p>
      </div>

      <div className="card-grid-3">
        {/* Card 1 */}
        <div className="p-card bg-white border border-[#E6EAF2] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-card transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FFF1F5] text-[#FF4D8D] flex items-center justify-center text-2xl mb-5">
            ⏳
          </div>
          <h4 className="text-lg font-extrabold text-[#0B1220] mb-2.5">
            Happy customers leave and forget
          </h4>
          <p className="text-[14.5px] text-[#5B6472] leading-relaxed">
            Diners leave smiling and promise to leave 5 stars, but life gets in the way. Once they step out the door, the moment is lost forever.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-card bg-white border border-[#E6EAF2] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-card transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FFF8E8] text-[#F5A524] flex items-center justify-center text-2xl mb-5">
            📢
          </div>
          <h4 className="text-lg font-extrabold text-[#0B1220] mb-2.5">
            Unhappy customers vent in public
          </h4>
          <p className="text-[14.5px] text-[#5B6472] leading-relaxed">
            When service is slow or food is cold, diners don&apos;t complain to the busy manager — they open Google Maps and leave a damaging 1-star review for the world to see.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-card bg-white border border-[#E6EAF2] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-card transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center text-2xl mb-5">
            📇
          </div>
          <h4 className="text-lg font-extrabold text-[#0B1220] mb-2.5">
            Zero customer database collected
          </h4>
          <p className="text-[14.5px] text-[#5B6472] leading-relaxed">
            Thousands of walk-in guests visit your outlet every month, but you have no phone numbers or contact list to invite them back with festive offers.
          </p>
        </div>
      </div>
    </section>
  );
}
