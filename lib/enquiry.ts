'use client';

import { useCallback, useRef, useState } from 'react';

// Contact forms are handled by Netlify Forms. Netlify discovers the two forms
// from the hidden copies in public/__forms.html at deploy time; the React
// forms post the same fields to that file, and Netlify stores each
// submission (Netlify dashboard → Forms) and emails a notification.
//
// The field names here must match public/__forms.html exactly, or Netlify
// silently drops the unknown fields.
export type FormName = 'hospo-enquiry' | 'tapro-enquiry';
export type FieldErrors = Partial<Record<'name' | 'email' | 'phone' | 'message', string>>;

// The shape HTML's own <input type="email"> accepts: local@domain.tld, no
// spaces. It checks the format only; it cannot tell whether the mailbox exists.
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
// Loose on purpose: international formats vary (spaces, dashes, brackets, +).
const PHONE_RE = /^[+()\d\s-]{7,20}$/;
const HAS_LETTER_RE = /\p{L}/u;

// Validation runs in the browser only (a static site has no server). It exists
// to help genuine visitors fix mistakes before sending; spam is filtered by
// Netlify's honeypot and Akismet checks, not by these rules.
export function validateEnquiry(data: FormData): FieldErrors {
  const get = (k: string) => String(data.get(k) ?? '').trim();
  const name = get('name');
  const email = get('email');
  const phone = get('phone');
  const message = get('message');
  const errors: FieldErrors = {};

  if (name.length < 2 || name.length > 200 || !HAS_LETTER_RE.test(name)) {
    errors.name = 'Please enter your name.';
  }
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (email.length > 254 || !EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email address, like name@example.com.';
  }
  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = 'Please enter a valid phone number (digits, spaces, +, - and brackets only).';
  }
  if (message.length < 10) {
    errors.message = 'Please enter a message of at least 10 characters.';
  } else if (message.length > 5000) {
    errors.message = 'Please keep your message under 5,000 characters.';
  }
  return errors;
}

async function submitToNetlify(formName: FormName, data: FormData): Promise<void> {
  const body = new URLSearchParams();
  body.set('form-name', formName);
  data.forEach((value, key) => {
    if (typeof value === 'string') body.set(key, value.trim());
  });

  const res = await fetch('/__forms.html', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Form submission failed with HTTP ${res.status}`);
}

export type EnquiryStatus = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Shared submit logic for both brands' contact forms: validates, shows
 * field-level errors and moves focus to the first one, then submits to
 * Netlify. A failed submission keeps everything the visitor typed, so they
 * can simply press Send again.
 */
export function useEnquiryForm(formName: FormName) {
  const [status, setStatus] = useState<EnquiryStatus>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);

      const fieldErrors = validateEnquiry(data);
      setErrors(fieldErrors);
      const firstInvalid = Object.keys(fieldErrors)[0];
      if (firstInvalid) {
        (form.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
        return;
      }

      setStatus('sending');
      try {
        await submitToNetlify(formName, data);
        setStatus('sent');
      } catch {
        setStatus('error');
      }
    },
    [formName]
  );

  /** Props for an input: wires aria-invalid and the error message id. */
  const fieldProps = (name: keyof FieldErrors) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${formName}-${name}-error` : undefined,
  });

  return { status, errors, formRef, onSubmit, fieldProps };
}
