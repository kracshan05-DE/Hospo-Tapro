'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { deliverNotification, type EmailRecord } from '@/lib/inquiry-notify';
import { logServerError } from '@/lib/log';
import { isRateLimited, isSuspiciouslyFast } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { parseInquiry } from '@/lib/validation';
import type { Brand } from '@/lib/types';

export type InquiryResult = { ok: true } | { ok: false; error: string };

// Shared handler for both brands' public contact forms.
//
// Order matters:
//   1. bot checks + validation
//   2. SAVE the inquiry (service role; anonymous inserts are blocked by RLS)
//   3. reply to the visitor
//   4. send the email notification AFTER the response (next/server `after`)
// An email failure therefore can never lose an inquiry or show the visitor an
// error; it is recorded on the row and can be re-sent from the dashboard.
async function submitInquiry(brand: Brand, formData: FormData): Promise<InquiryResult> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Honeypot: real visitors never see or fill this hidden field.
  if (String(formData.get('bot-field') || '').trim()) return { ok: true };

  // Submissions faster than a human could type are silently dropped.
  const renderedAt = Number(formData.get('form_rendered_at') || 0);
  if (renderedAt && isSuspiciouslyFast(renderedAt)) return { ok: true };

  const turnstileToken = String(formData.get('cf-turnstile-response') || '');
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, error: 'Verification failed. Please refresh the page and try again.' };
  }

  if (await isRateLimited(`inquiry:${brand}:${ip}`)) {
    return { ok: false, error: 'Too many submissions. Please try again in a minute.' };
  }

  const parsed = parseInquiry(brand, formData);
  if (!parsed.ok) return parsed;

  // The id is generated here so the row never has to be read back: this
  // keeps the insert working with or without the service-role key.
  const saved = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...parsed.value };
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const { error } = await (hasServiceKey ? createAdminClient() : anonClient()).from('inquiries').insert(saved);
    if (error) throw error;
  } catch (error) {
    logServerError('inquiries.submit', error);
    return {
      ok: false,
      error: 'Sorry, we could not send your enquiry. Please try again, or email info@hospofresh.com.au.',
    };
  }

  after(async () => {
    await deliverNotification(saved, {
      record: async (id, update: EmailRecord) => {
        // Delivery status can only be recorded with the service-role key.
        if (!hasServiceKey) return;
        const { error } = await createAdminClient().from('inquiries').update(update).eq('id', id);
        if (error) throw error;
      },
    });
  });

  return { ok: true };
}

// Transitional safety net: if SUPABASE_SERVICE_ROLE_KEY hasn't been set in
// the deployment yet, save with the public anon key instead. That only works
// while the database still allows anonymous inserts (before the security
// migration); afterwards the service-role key is required. Either way the
// database's RLS decides, so this never widens access.
function anonClient() {
  logServerError('inquiries.submit', 'SUPABASE_SERVICE_ROLE_KEY is not set; using anon fallback');
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

export async function submitHospoInquiry(formData: FormData): Promise<InquiryResult> {
  return submitInquiry('hospo_fresh', formData);
}

export async function submitTaproInquiry(formData: FormData): Promise<InquiryResult> {
  return submitInquiry('tapro', formData);
}
