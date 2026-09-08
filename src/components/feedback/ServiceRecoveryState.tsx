'use client';

import React from 'react';

interface ServiceRecoveryStateProps {
  businessName: string;
  customerName: string;
  googleReviewUrl: string;
  brandColour?: string;
  onReset?: () => void;
}

export function ServiceRecoveryState({
  businessName,
  customerName,
  googleReviewUrl,
  brandColour = '#2563EB',
  onReset,
}: ServiceRecoveryStateProps) {
  return (
    <div className="text-center py-6 px-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#FFF1F5] flex items-center justify-center mb-5 shadow-[0_10px_25px_-8px_rgba(255,77,141,0.3)]">
        <span className="text-3xl sm:text-4xl">🙏</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-[#0B1220] tracking-tight mb-2">
        Thank You, {customerName}.
      </h2>
      <p className="text-sm sm:text-base text-[#5B6472] max-w-md mx-auto leading-relaxed mb-6">
        We appreciate your honest feedback about <strong className="text-[#0B1220]">{businessName}</strong>.
      </p>

      {/* Service Recovery Message */}
      <div className="bg-[#FFF7F7] border border-[#FED7D7] rounded-2xl p-5 mb-6 text-left">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D8D]"></span>
          <h4 className="text-sm font-bold text-[#9B2C2C]">Manager Follow-Up Alerted</h4>
        </div>
        <p className="text-xs text-[#742A2A] leading-relaxed">
          We&apos;re truly sorry your experience wasn&apos;t 5-star. Our manager has been alerted with your comments and will follow up with you directly to make things right.
        </p>
      </div>

      {/* COMPLIANCE: Google Review link MUST remain clearly visible and accessible */}
      <div className="border-t border-[#E6EAF2] pt-6 mb-6">
        <p className="text-xs text-[#8A93A3] mb-3">
          You are also welcome to post your feedback publicly on Google:
        </p>
        <a
          href={googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline w-full text-sm font-bold py-3 flex items-center justify-center gap-2 hover:bg-[#0B1220] hover:text-white"
        >
          <span>Share on Google Reviews</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-[#8A93A3] hover:text-[#5B6472] font-semibold transition-colors"
        >
          Submit another feedback
        </button>
      )}
    </div>
  );
}
