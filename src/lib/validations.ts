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
