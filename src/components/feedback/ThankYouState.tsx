'use client';

import React from 'react';

interface ThankYouStateProps {
  businessName: string;
  customerName: string;
  googleReviewUrl: string;
  brandColour?: string;
  onReset?: () => void;
}

export function ThankYouState({
  businessName,
  customerName,
  googleReviewUrl,
  brandColour = '#2563EB',
  onReset,
}: ThankYouStateProps) {
  return (
    <div className="text-center py-6 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#EAFBF5] flex items-center justify-center mb-5 shadow-[0_10px_25px_-8px_rgba(0,200,150,0.4)]">
        <span className="text-3xl sm:text-4xl">🎉</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-[#0B1220] tracking-tight mb-2">
        Thank You, {customerName}!
      </h2>
      <p className="text-sm sm:text-base text-[#5B6472] max-w-md mx-auto leading-relaxed mb-8">
        We&apos;re delighted you enjoyed your visit to <strong className="text-[#0B1220]">{businessName}</strong>. 
        Your 5-star rating means the world to our team!
      </p>

      <div className="bg-[#F5F8FF] border border-[#E6EAF2] rounded-2xl p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E6EAF2] flex items-center justify-center font-bold text-[#00C896]">
            ★
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0B1220]">Help others discover us</h4>
            <p className="text-xs text-[#8A93A3]">Takes only 10 seconds on Google</p>
          </div>
        </div>
        <p className="text-xs text-[#5B6472] leading-relaxed">
          Sharing your review on Google helps other locals find us and directly supports our staff.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg w-full text-base font-bold shadow-lg flex items-center justify-center gap-3 text-white"
          style={{
            backgroundColor: brandColour,
            borderColor: brandColour,
          }}
        >
          <span>Post Review on Google</span>
          <span className="text-[#F5A524] text-lg">★★★★★</span>
        </a>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#8A93A3] hover:text-[#5B6472] font-semibold py-2 transition-colors"
          >
            Submit another feedback
          </button>
        )}
      </div>
    </div>
  );
}
