import { describe, expect, it, vi } from 'vitest';
import { buildInquiryEmail, escapeHtml, sendInquiryNotification, type NotifiableInquiry } from '@/lib/email';

const inquiry: NotifiableInquiry = {
  id: '6f1c2c1e-1111-4a4a-9b9b-123456789abc',
  brand: 'tapro',
  name: 'Ama <script>alert(1)</script>',
  email: 'ama@shop.lk',
  business: 'Silva & Sons',
  phone: null,
  enquiry_type: null,
  message: 'Line one\n<b>bold?</b>',
  created_at: '2026-11-16T10:00:00Z',
};
const env = { RESEND_API_KEY: 're_test', RESEND_FROM: 'Site <web@hospofresh.com.au>', INQUIRY_NOTIFY_TO: 'info@hospofresh.com.au, owner@x.com', NEXT_PUBLIC_SITE_URL: 'https://hospofresh.com.au' };

describe('buildInquiryEmail', () => {
  it('escapes customer input in the HTML body', () => {
    const { html } = buildInquiryEmail(inquiry, 'https://hospofresh.com.au');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Silva &amp; Sons');
    expect(html).toContain('&lt;b&gt;bold?&lt;/b&gt;');
  });
  it('cannot be used for header injection via name or email', () => {
    const { subject, replyTo } = buildInquiryEmail({ ...inquiry, name: 'X\r\nBcc: evil@x.com', email: 'a@b.co\nBcc: e@x.com' }, 'https://x');
    expect(subject).not.toMatch(/[\r\n]/);
    expect(replyTo).not.toMatch(/[\r\n]/);
  });
  it('links to the enquiries dashboard', () => {
    expect(buildInquiryEmail(inquiry, 'https://hospofresh.com.au/').text).toContain('https://hospofresh.com.au/admin/dashboard/inquiries');
  });
  it('escapeHtml covers quotes', () => {
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });
});

describe('sendInquiryNotification', () => {
  it('posts to Resend with reply-to, all recipients and an idempotency key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email_1' }), { status: 200 }));
    const r = await sendInquiryNotification(inquiry, { env, fetchImpl });
    expect(r).toEqual({ ok: true, id: 'email_1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers['Idempotency-Key']).toBe(`inquiry-${inquiry.id}`);
    const body = JSON.parse(init.body);
    expect(body.to).toEqual(['info@hospofresh.com.au', 'owner@x.com']);
    expect(body.reply_to).toBe('ama@shop.lk');
  });
  it('returns an error (does not throw) when Resend rejects the request', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'domain not verified' }), { status: 403 }));
    const r = await sendInquiryNotification(inquiry, { env, fetchImpl });
    expect(r).toEqual({ ok: false, error: 'Resend 403: domain not verified' });
  });
  it('returns an error (does not throw) on network failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    expect(await sendInquiryNotification(inquiry, { env, fetchImpl })).toEqual({ ok: false, error: 'ECONNRESET' });
  });
  it('reports missing configuration instead of sending', async () => {
    const fetchImpl = vi.fn();
    const r = await sendInquiryNotification(inquiry, { env: {}, fetchImpl });
    expect(r.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
