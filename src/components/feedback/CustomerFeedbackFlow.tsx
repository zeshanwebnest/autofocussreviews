'use client';

import React, { useState } from 'react';
import { Client } from '@/types/app.types';
import { StarRatingInput } from './StarRatingInput';
import { ThankYouState } from './ThankYouState';
import { ServiceRecoveryState } from './ServiceRecoveryState';
import { validateIndianPhone, validateCustomerName } from '@/lib/validations';

interface CustomerFeedbackFlowProps {
  client: Client;
  onSuccess?: () => void;
}

export function CustomerFeedbackFlow({ client, onSuccess }: CustomerFeedbackFlowProps) {
  const [rating, setRating] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; rating?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedState, setSubmittedState] = useState<'happy' | 'recovery' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newErrors: { name?: string; phone?: string; rating?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Please tap a star to give your rating.';
    }

    const nameValidation = validateCustomerName(name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error;
    }

    const phoneValidation = validateIndianPhone(phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          name: nameValidation.value,
          phone: phoneValidation.value,
          rating,
          comment: rating <= (client.alert_threshold ?? 3) ? comment : null,
          source: 'qr',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback. Please try again.');
      }

      if (rating >= 4) {
        setSubmittedState('happy');
      } else {
        setSubmittedState('recovery');
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[Feedback Submit Error]', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedState(null);
    setRating(0);
    setName('');
    setPhone('');
    setComment('');
    setErrors({});
  };

  if (submittedState === 'happy') {
    return (
      <ThankYouState
        businessName={client.business_name}
        customerName={name || 'Valued Customer'}
        googleReviewUrl={client.google_review_url}
        brandColour={client.brand_colour}
        onReset={handleReset}
      />
    );
  }

  if (submittedState === 'recovery') {
    return (
      <ServiceRecoveryState
        businessName={client.business_name}
        customerName={name || 'Valued Customer'}
        googleReviewUrl={client.google_review_url}
        brandColour={client.brand_colour}
        onReset={handleReset}
      />
    );
  }

  const isLowRating = rating > 0 && rating <= (client.alert_threshold ?? 3);

  return (
    <div className="w-full">
      {/* Business Header */}
      <div className="text-center mb-6">
        {client.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.logo_url}
            alt={client.business_name}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl object-cover mb-3 shadow-md border border-[#E6EAF2]"
          />
        ) : (
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-3 shadow-md"
            style={{ backgroundColor: client.brand_colour || '#2563EB' }}
          >
            {client.business_name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-black text-[#0B1220] tracking-tight">
          {client.business_name}
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6472] mt-1 font-medium">
          How was your experience today?
        </p>
      </div>

      {submitError && (
        <div className="mb-5 p-3.5 bg-[#FFF1F5] border border-[#FED7D7] rounded-xl text-xs font-semibold text-[#FF4D8D]">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* 1. STAR RATING — FIRST ELEMENT ON SCREEN */}
        <div className="bg-white border border-[#E6EAF2] rounded-2xl p-4 sm:p-5 shadow-sm text-center">
          <StarRatingInput
            value={rating}
            onChange={handleRatingChange}
            brandColour={client.brand_colour}
            disabled={isSubmitting}
          />
          {errors.rating && (
            <p className="text-xs font-bold text-[#FF4D8D] mt-2 animate-shake">
              {errors.rating}
            </p>
          )}
        </div>

        {/* 2. CUSTOMER NAME */}
        <div>
          <label htmlFor="customer-name" className="block text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1.5">
            Your Name <span className="text-[#FF4D8D]">*</span>
          </label>
          <input
            id="customer-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Rohan Sharma"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 text-sm rounded-xl border bg-white text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 transition-all ${
              errors.name ? 'border-[#FF4D8D] focus:ring-[#FF4D8D]/20' : 'border-[#E6EAF2] focus:ring-[#2563EB]/20'
            }`}
          />
          {errors.name && (
            <p className="text-xs font-semibold text-[#FF4D8D] mt-1">{errors.name}</p>
          )}
        </div>

        {/* 3. CUSTOMER PHONE */}
        <div>
          <label htmlFor="customer-phone" className="block text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1.5">
            Mobile Number <span className="text-[#FF4D8D]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A93A3]">
              +91
            </span>
            <input
              id="customer-phone"
              type="tel"
              inputMode="numeric"
              maxLength={14}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              placeholder="98200 12345"
              disabled={isSubmitting}
              className={`w-full pl-12 pr-4 py-3 text-sm rounded-xl border bg-white text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 transition-all ${
                errors.phone ? 'border-[#FF4D8D] focus:ring-[#FF4D8D]/20' : 'border-[#E6EAF2] focus:ring-[#2563EB]/20'
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="text-xs font-semibold text-[#FF4D8D] mt-1">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-[#8A93A3] mt-1">We respect your privacy. No spam.</p>
          )}
        </div>

        {/* 4. CONDITIONAL COMMENT FIELD (RENDERED ONLY WHEN RATING <= 3) */}
        {isLowRating && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label htmlFor="customer-comment" className="block text-xs font-bold text-[#9B2C2C] uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>What went wrong? (Optional)</span>
              <span className="text-[10px] text-[#8A93A3] lowercase">owner reads privately</span>
            </label>
            <textarea
              id="customer-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what happened so our manager can fix it for you..."
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm rounded-xl border border-[#FED7D7] bg-[#FFF7F7] text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#FF4D8D]/20 resize-none transition-all"
            />
          </div>
        )}

        {/* 5. SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-lg w-full mt-2 font-bold text-base text-white shadow-btn flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          style={{
            backgroundColor: client.brand_colour || '#2563EB',
            borderColor: client.brand_colour || '#2563EB',
            opacity: isSubmitting ? 0.75 : 1,
          }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Submitting…</span>
            </>
          ) : (
            <span>Submit Feedback</span>
          )}
        </button>
      </form>
    </div>
  );
}
