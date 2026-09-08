'use client';

import React, { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  brandColour?: string;
  disabled?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  brandColour = '#2563EB',
  disabled = false,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeScore = hoverRating !== null ? hoverRating : value;

  const labels = ['', 'Poor', 'Fair', 'Average', 'Good', 'Excellent!'];

  return (
    <div className="flex flex-col items-center justify-center py-1 w-full">
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 w-full max-w-[280px]" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeScore;
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => !disabled && setHoverRating(null)}
              className="group p-0.5 sm:p-1 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-xl transition-all duration-150 transform hover:scale-110 active:scale-95 flex-1 flex justify-center"
              style={{
                outlineColor: brandColour,
              }}
              aria-label={`${star} Star${star > 1 ? 's' : ''}`}
            >
              <svg
                className={`w-8 h-8 sm:w-11 sm:h-11 transition-colors duration-150 ${
                  isFilled
                    ? 'text-[#F5A524] drop-shadow-[0_2px_8px_rgba(245,165,36,0.4)]'
                    : 'text-[#E6EAF2] hover:text-[#FCD34D]'
                }`}
                fill={isFilled ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isFilled ? '1' : '1.5'}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      {activeScore > 0 ? (
        <span className="text-xs sm:text-sm font-bold mt-2 text-[#5B6472] tracking-wide">
          {labels[activeScore]}
        </span>
      ) : (
        <span className="text-xs text-[#8A93A3] mt-2 font-medium">Tap a star to rate your experience</span>
      )}
    </div>
  );
}
