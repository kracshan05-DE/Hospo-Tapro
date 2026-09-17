'use server';

import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';
import { isRateLimited, isSuspiciouslyFast } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { headers } from 'next/headers';
import type { Brand } from '@/lib/types';

export type InquiryResult = { ok: true } | { ok: false; error: string };

// Shared handler for both brands' public contact forms. Both forms post into
// the same `inquiries` table (see supabase/schema.sql), distinguished by `brand`.
async function submitInquiry(brand: Brand, formData: FormData): Promise<InquiryResult> {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Honeypot: real visitors never see or fill this hidden field.
  const honeypot = String(formData.get('bot-field') || '').trim();
  if (honeypot) return { ok: true }; // pretend success, drop silently

  // Basic bot-speed heuristic: reject submissions faster than a human could type.
  const renderedAt = Number(formData.get('form_rendered_at') || 0);
  if (renderedAt && isSuspiciouslyFast(renderedAt)) {
    return { ok: true }; // pretend success, drop silently
  }

  // Real bot verification (see lib/turnstile.ts) — this is the layer that
  // actually stops scripted spam; the two checks above only catch the
  // laziest bots.
  const turnstileToken = String(formData.get('cf-turnstile-response') || '');
  const humanVerified = await verifyTurnstile(turnstileToken, ip);
  if (!humanVerified) {
    return { ok: false, error: 'Verification failed. Please try again.' };
  }

  if (await isRateLimited(`inquiry:${brand}:${ip}`)) {
    return { ok: false, error: 'Too many submissions. Please try again in a minute.' };
  }

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const business = String(formData.get('business') || '').trim();
  const phone = String(formData.get('phone') || '').trim();
  const enquiry_type = String(formData.get('enquiry') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!name || !email || !message) {
    return { ok: false, error: 'Please fill in your name, email and message.' };
  }
  if (!email.includes('@') || email.length > 254) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (name.length > 200 || message.length > 5000) {
    return { ok: false, error: 'That submission is too long. Please shorten it.' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('inquiries').insert({
    brand,
    name,
    email,
    business: business || null,
    phone: phone || null,
    enquiry_type: enquiry_type || null,
    message,
  });

  if (error) {
    logServerError('inquiries.submit', error);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
  return { ok: true };
}

export async function submitHospoInquiry(formData: FormData): Promise<InquiryResult> {
  return submitInquiry('hospo_fresh', formData);
}

export async function submitTaproInquiry(formData: FormData): Promise<InquiryResult> {
  return submitInquiry('tapro', formData);
}
