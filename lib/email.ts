import type { Brand } from './types';

// New-inquiry notification emails, sent through Resend's HTTP API (no SDK
// needed). Configuration (all server-side env vars):
//   RESEND_API_KEY      required to send; if missing, notification is recorded as failed
//   INQUIRY_NOTIFY_TO   recipient(s), comma-separated (e.g. info@hospofresh.com.au)
//   RESEND_FROM         verified sender, e.g. "Hospo Fresh Website <website@hospofresh.com.au>"
//   NEXT_PUBLIC_SITE_URL used for the dashboard link in the email

export type NotifiableInquiry = {
  id: string;
  brand: Brand;
  name: string;
  email: string;
  business: string | null;
  phone: string | null;
  enquiry_type: string | null;
  message: string;
  created_at: string;
};

const BRAND_LABEL: Record<Brand, string> = { hospo_fresh: 'Hospo Fresh', tapro: 'Tapro' };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Removes CR/LF so customer input can never inject extra email headers.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

export function buildInquiryEmail(inquiry: NotifiableInquiry, siteUrl: string) {
  const brand = BRAND_LABEL[inquiry.brand];
  const subject = oneLine(`New ${brand} enquiry from ${inquiry.name}`).slice(0, 200);
  const dashboardUrl = `${siteUrl.replace(/\/$/, '')}/admin/dashboard/inquiries`;
  const received = new Date(inquiry.created_at).toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rows: [string, string | null][] = [
    ['Brand', brand],
    ['Name', inquiry.name],
    ['Email', inquiry.email],
    ['Phone', inquiry.phone],
    ['Business', inquiry.business],
    ['Enquiry type', inquiry.enquiry_type],
    ['Received', `${received} (Melbourne)`],
  ];
  const present = rows.filter((r): r is [string, string] => !!r[1]);

  const text = [
    `New enquiry received through the ${brand} website.`,
    '',
    ...present.map(([k, v]) => `${k}: ${v}`),
    '',
    'Message:',
    inquiry.message,
    '',
    `Reply to this email to respond to the customer directly.`,
    `Manage enquiries: ${dashboardUrl}`,
  ].join('\n');

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#16211c;line-height:1.5">
<h2 style="margin:0 0 12px">New ${escapeHtml(brand)} enquiry</h2>
<table cellpadding="6" style="border-collapse:collapse">${present
    .map(
      ([k, v]) =>
        `<tr><td style="color:#68736b;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`
    )
    .join('')}</table>
<p style="color:#68736b;margin:16px 0 4px">Message</p>
<div style="white-space:pre-wrap;border-left:3px solid #bb8531;padding:8px 12px;background:#f6f3eb">${escapeHtml(
    inquiry.message
  )}</div>
<p style="margin-top:20px">Reply to this email to respond to the customer directly.<br>
<a href="${escapeHtml(dashboardUrl)}">Open the enquiries dashboard</a></p>
</body></html>`;

  return { subject, text, html, replyTo: oneLine(inquiry.email) };
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export async function sendInquiryNotification(
  inquiry: NotifiableInquiry,
  options: { idempotencyKey?: string; env?: Record<string, string | undefined>; fetchImpl?: FetchLike } = {}
): Promise<SendResult> {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiKey = env.RESEND_API_KEY;
  const to = (env.INQUIRY_NOTIFY_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const from = env.RESEND_FROM;
  if (!apiKey || !from || to.length === 0) {
    return { ok: false, error: 'Email is not configured (RESEND_API_KEY / RESEND_FROM / INQUIRY_NOTIFY_TO).' };
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || 'https://hospofresh.com.au';
  const { subject, text, html, replyTo } = buildInquiryEmail(inquiry, siteUrl);

  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        // Resend de-duplicates requests carrying the same key for 24h, so the
        // automatic notification can never be delivered twice. Manual resends
        // pass a fresh key.
        'Idempotency-Key': options.idempotencyKey ?? `inquiry-${inquiry.id}`,
      },
      body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${body.message ?? res.statusText}`.slice(0, 500) };
    }
    return { ok: true, id: body.id ?? null };
  } catch (error) {
    return { ok: false, error: (error instanceof Error ? error.message : String(error)).slice(0, 500) };
  }
}
