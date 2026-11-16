import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---- fakes for the framework and services the action depends on ----------
const afterCallbacks: Array<() => Promise<void>> = [];
vi.mock('next/server', () => ({ after: (cb: () => Promise<void>) => afterCallbacks.push(cb) }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-forwarded-for': '203.0.113.7' }) }));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn(async () => true) }));
vi.mock('@/lib/rate-limit', () => ({ isRateLimited: vi.fn(async () => false), isSuspiciouslyFast: () => false }));

const sendMock = vi.fn();
vi.mock('@/lib/email', () => ({ sendInquiryNotification: (...args: unknown[]) => sendMock(...args) }));

const inserted: { via: string; row: Record<string, unknown> }[] = [];
const updates: { id: string; values: Record<string, unknown> }[] = [];
let insertError: Error | null = null;

const fakeClient = (via: string) => ({
  from: (table: string) => {
    expect(table).toBe('inquiries');
    return {
      insert: async (row: Record<string, unknown>) => {
        if (insertError) return { error: insertError };
        inserted.push({ via, row });
        return { error: null };
      },
      update: (values: Record<string, unknown>) => ({
        eq: async (_col: string, id: string) => {
          updates.push({ id, values });
          return { error: null };
        },
      }),
    };
  },
});
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => fakeClient('service') }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => fakeClient('anon') }));
vi.spyOn(console, 'error').mockImplementation(() => {});

const { submitTaproInquiry, submitHospoInquiry } = await import('@/app/actions/inquiries');

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
  return fd;
};
const validForm = () =>
  form({ name: 'Jane Buyer', email: 'jane@cafe.com.au', message: 'Please send your wholesale catalogue.', 'cf-turnstile-response': 'tok' });

async function runAfter() {
  while (afterCallbacks.length) await afterCallbacks.shift()!();
}

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  afterCallbacks.length = 0;
  inserted.length = 0;
  updates.length = 0;
  insertError = null;
  sendMock.mockReset();
});

describe('contact form submission', () => {
  it('SAVES the inquiry and reports success even when the email provider is down', async () => {
    sendMock.mockRejectedValue(new Error('Resend unreachable'));
    const result = await submitTaproInquiry(validForm());

    expect(result).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect(inserted[0].via).toBe('service');
    expect(inserted[0].row).toMatchObject({ brand: 'tapro', name: 'Jane Buyer', email: 'jane@cafe.com.au' });

    await runAfter();
    expect(updates).toEqual([{ id: inserted[0].row.id, values: { email_status: 'failed', email_error: 'Resend unreachable' } }]);
  });

  it('records a failed status when Resend rejects the email', async () => {
    sendMock.mockResolvedValue({ ok: false, error: 'Resend 403: domain not verified' });
    expect(await submitHospoInquiry(validForm())).toEqual({ ok: true });
    await runAfter();
    expect(inserted[0].row).toMatchObject({ brand: 'hospo_fresh' });
    expect(updates[0].values).toMatchObject({ email_status: 'failed', email_error: 'Resend 403: domain not verified' });
  });

  it('records sent status when the email goes out', async () => {
    sendMock.mockResolvedValue({ ok: true, id: 'email_1' });
    await submitTaproInquiry(validForm());
    await runAfter();
    expect(updates[0].values).toMatchObject({ email_status: 'sent', email_error: null });
    expect(typeof updates[0].values.email_sent_at).toBe('string');
  });

  it('does not send an email for an inquiry that failed to save, and tells the visitor', async () => {
    insertError = new Error('database unavailable');
    const result = await submitTaproInquiry(validForm());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('info@hospofresh.com.au');
    await runAfter();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('still saves (via the anon fallback) when the service-role key is not configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    sendMock.mockResolvedValue({ ok: true, id: 'email_1' });
    expect(await submitTaproInquiry(validForm())).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect(inserted[0].via).toBe('anon');
    await runAfter();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(updates).toHaveLength(0); // delivery status needs the service-role key
  });

  it('never saves invalid input', async () => {
    const result = await submitTaproInquiry(form({ name: 'J', email: 'bad', message: 'hi' }));
    expect(result.ok).toBe(false);
    expect(inserted).toHaveLength(0);
  });

  it('silently drops honeypot (bot) submissions without saving or emailing', async () => {
    const fd = validForm();
    fd.set('bot-field', 'http://spam.example');
    expect(await submitTaproInquiry(fd)).toEqual({ ok: true });
    await runAfter();
    expect(inserted).toHaveLength(0);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
