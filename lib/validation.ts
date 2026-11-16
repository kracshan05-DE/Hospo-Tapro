// Pure validation helpers shared by server actions (and unit-tested).
// The database enforces the same limits with CHECK constraints; these give
// the visitor a friendly message before the request ever reaches it.

import type { Brand, InquiryStatus } from './types';

// The pattern HTML5 <input type="email"> uses: confirms the address is shaped
// like an email, not that it exists.
export const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_RE = /^[+()\d\s-]{7,20}$/;
const HAS_LETTER_RE = /[a-zA-Z]/;

export const INQUIRY_STATUSES: readonly InquiryStatus[] = ['new', 'in_progress', 'resolved'];

export type InquiryInput = {
  brand: Brand;
  name: string;
  email: string;
  business: string | null;
  phone: string | null;
  enquiry_type: string | null;
  message: string;
};

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const field = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

export function parseInquiry(brand: Brand, formData: FormData): Validated<InquiryInput> {
  const name = field(formData, 'name');
  const email = field(formData, 'email');
  const business = field(formData, 'business');
  const phone = field(formData, 'phone');
  const enquiry_type = field(formData, 'enquiry');
  const message = field(formData, 'message');

  if (!name || !email || !message) {
    return { ok: false, error: 'Please fill in your name, email and message.' };
  }
  if (name.length < 2 || name.length > 200 || !HAS_LETTER_RE.test(name)) {
    return { ok: false, error: 'Please enter your full name.' };
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { ok: false, error: 'Please enter a valid phone number.' };
  }
  if (business.length > 200) {
    return { ok: false, error: 'Business name must be under 200 characters.' };
  }
  if (enquiry_type.length > 100) {
    return { ok: false, error: 'Please choose a valid enquiry type.' };
  }
  if (message.length < 10 || message.length > 5000) {
    return { ok: false, error: 'Please enter a message between 10 and 5000 characters.' };
  }

  return {
    ok: true,
    value: {
      brand,
      name,
      email,
      business: business || null,
      phone: phone || null,
      enquiry_type: enquiry_type || null,
      message,
    },
  };
}

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === 'string' && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

// Minimum strength rule for admin passwords. Length beats complexity rules.
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < 12) return 'Use at least 12 characters.';
  if (password.length > 72) return 'Use 72 characters or fewer.';
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}

// Strips characters that have meaning in PostgREST filter syntax or LIKE
// patterns, so a search box can't alter the query.
export function sanitizeSearch(raw: string | undefined | null): string {
  return String(raw ?? '')
    .replace(/[,()"'\\%_*:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
