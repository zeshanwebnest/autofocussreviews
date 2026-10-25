/**
 * Validation utilities for customer feedback and client onboarding.
 */

export interface ValidationResult<T> {
  isValid: boolean;
  value?: T;
  error?: string;
}

/**
 * Sanitizes and validates a 10-digit Indian mobile number.
 * Accepts: "+91 98200 12345", "09820012345", "9820012345", "98200-12345"
 * Valid: Must start with 6, 7, 8, or 9 and have exactly 10 digits.
 */
export function validateIndianPhone(input: string): ValidationResult<string> {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Strip all non-digit characters
  let digits = input.replace(/\D/g, '');

  // Strip leading 91 if it's 12 digits (e.g. 919820012345)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // Strip leading 0 if 11 digits (e.g. 09820012345)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length === 0) {
    return { isValid: false, error: 'Please enter your mobile number.' };
  }

  if (digits.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }

  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, error: 'Invalid Indian mobile number (must start with 6, 7, 8, or 9).' };
  }

  return { isValid: true, value: digits };
}

/**
 * Validates customer name.
 */
export function validateCustomerName(input: string): ValidationResult<string> {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Your name is required.' };
  }

  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Please enter your full name (at least 2 characters).' };
  }

  if (trimmed.length > 80) {
    return { isValid: false, error: 'Name cannot exceed 80 characters.' };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validates star rating (1 to 5).
 */
export function validateRating(input: any): ValidationResult<number> {
  const num = Number(input);
  if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 5) {
    return { isValid: false, error: 'Please select a rating between 1 and 5 stars.' };
  }
  return { isValid: true, value: num };
}

/**
 * Sanitizes comment.
 */
export function sanitizeComment(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 1000) : null;
}

/**
 * Validates a Google review link.
 *
 * Accepts only the handful of hosts Google actually serves review links from.
 * A wrong link here is expensive and invisible: every happy customer is sent
 * to someone else's listing, and nobody notices for weeks.
 */
export function validateGoogleReviewUrl(input: string): ValidationResult<string> {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'A Google review link is required.' };
  }

  const trimmed = input.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'That is not a complete web address. It should start with https://',
    };
  }

  if (url.protocol !== 'https:') {
    return { isValid: false, error: 'The link must start with https:// for security.' };
  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  // Short links Google generates from the "Share" / "Ask for reviews" buttons.
  const isShortLink =
    host === 'g.page' || host === 'maps.app.goo.gl' || (host === 'goo.gl' && path.startsWith('/maps'));

  // The long-form write-a-review URL.
  const isWriteReview = host === 'search.google.com' && path.startsWith('/local/writereview');

  // A plain Maps listing link.
  const isMapsLink =
    (host === 'www.google.com' || host === 'google.com' || host === 'maps.google.com') &&
    path.startsWith('/maps');

  if (!isShortLink && !isWriteReview && !isMapsLink) {
    return {
      isValid: false,
      error:
        `"${host}" is not a Google address. Use the link from your Google Business Profile — ` +
        'it normally looks like https://g.page/r/..., https://maps.app.goo.gl/... or ' +
        'https://search.google.com/local/writereview?placeid=...',
    };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'That link is unusually long — please check it.' };
  }

  return { isValid: true, value: trimmed };
}
