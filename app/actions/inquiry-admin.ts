'use server';

import { revalidatePath } from 'next/cache';
import { getAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase-admin';
import { deliverNotification } from '@/lib/inquiry-notify';
import { sendInquiryNotification } from '@/lib/email';
import { logServerError } from '@/lib/log';
import { isInquiryStatus } from '@/lib/validation';

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DASHBOARD = '/admin/dashboard/inquiries';

// Status + internal notes. Runs with the admin's own session, so RLS and the
// column-level grant (only status/admin_notes are updatable) are enforced by
// the database as well as here.
export async function updateInquiry(
  id: string,
  input: { status: string; admin_notes: string }
): Promise<AdminActionResult> {
  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid enquiry.' };
  if (!isInquiryStatus(input.status)) return { ok: false, error: 'Invalid status.' };
  const notes = input.admin_notes.trim();
  if (notes.length > 5000) return { ok: false, error: 'Notes must be under 5000 characters.' };

  const { error, count } = await admin.supabase
    .from('inquiries')
    .update({ status: input.status, admin_notes: notes || null }, { count: 'exact' })
    .eq('id', id);
  if (error || count === 0) {
    logServerError('inquiries.update', error ?? 'no row updated');
    return { ok: false, error: 'Could not save. Please refresh and try again.' };
  }
  revalidatePath(DASHBOARD);
  return { ok: true };
}

export async function deleteInquiry(id: string): Promise<AdminActionResult> {
  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid enquiry.' };

  const { error, count } = await admin.supabase.from('inquiries').delete({ count: 'exact' }).eq('id', id);
  if (error || count === 0) {
    logServerError('inquiries.delete', error ?? 'no row deleted');
    return { ok: false, error: 'Could not delete. Please refresh and try again.' };
  }
  revalidatePath(DASHBOARD);
  return { ok: true };
}

// Re-sends the notification email for one inquiry (e.g. after a failure).
export async function resendInquiryEmail(id: string): Promise<AdminActionResult> {
  const admin = await getAdmin();
  if (!admin || admin.mustChangePassword) return { ok: false, error: 'Not authorised.' };
  if (!UUID_RE.test(id)) return { ok: false, error: 'Invalid enquiry.' };

  // Read through the admin's session first: proves this admin may see it.
  const { data: inquiry, error } = await admin.supabase
    .from('inquiries')
    .select('id, brand, name, email, business, phone, enquiry_type, message, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !inquiry) return { ok: false, error: 'Enquiry not found.' };

  const db = createAdminClient();
  const result = await deliverNotification(inquiry, {
    send: (inq) => sendInquiryNotification(inq, { idempotencyKey: `inquiry-${inq.id}-resend-${Date.now()}` }),
    record: async (inquiryId, update) => {
      const { error: recordError } = await db.from('inquiries').update(update).eq('id', inquiryId);
      if (recordError) throw recordError;
    },
  });
  revalidatePath(DASHBOARD);
  return result.ok ? { ok: true } : { ok: false, error: `Email failed: ${result.error}` };
}
