'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Inquiry, InquiryStatus } from '@/lib/types';
import { deleteInquiry, resendInquiryEmail, updateInquiry } from '@/app/actions/inquiry-admin';

const BRAND_LABEL = { hospo_fresh: 'Hospo Fresh', tapro: 'Tapro' } as const;
const STATUS_OPTIONS: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];
const EMAIL_LABEL = {
  sent: 'Email sent',
  failed: 'Email failed',
  pending: 'Email pending',
  skipped: 'Before email alerts',
} as const;

export default function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  const router = useRouter();
  const [status, setStatus] = useState<InquiryStatus>(inquiry.status);
  const [notes, setNotes] = useState(inquiry.admin_notes ?? '');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = status !== inquiry.status || notes.trim() !== (inquiry.admin_notes ?? '');
  const received = new Date(inquiry.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setMessage({ kind: 'ok', text: success });
        router.refresh();
      } else {
        setMessage({ kind: 'error', text: result.error ?? 'Something went wrong.' });
      }
    });
  }

  return (
    <article className={`inquiry-row status-${inquiry.status}`} aria-labelledby={`inq-${inquiry.id}`}>
      <div className="inquiry-head">
        <div className="meta">
          <span className={`brand-pill ${inquiry.brand === 'tapro' ? 'tapro' : 'hospo'}`}>{BRAND_LABEL[inquiry.brand]}</span>
          <span>{inquiry.enquiry_type || 'General enquiry'}</span>
          <time dateTime={inquiry.created_at}>{received}</time>
        </div>
        <span className={`email-badge email-${inquiry.email_status}`} title={inquiry.email_error ?? undefined}>
          {EMAIL_LABEL[inquiry.email_status]}
        </span>
      </div>

      <h3 id={`inq-${inquiry.id}`}>{inquiry.name}</h3>
      <p className="contact-line">
        <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
        {inquiry.phone && (
          <>
            {' · '}
            <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, '')}`}>{inquiry.phone}</a>
          </>
        )}
        {inquiry.business && <> · {inquiry.business}</>}
      </p>
      <p className="msg">{inquiry.message}</p>

      <div className="inquiry-manage">
        <div className="form-field">
          <label htmlFor={`status-${inquiry.id}`}>Status</label>
          <select id={`status-${inquiry.id}`} value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)} disabled={isPending}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-field notes-field">
          <label htmlFor={`notes-${inquiry.id}`}>Internal notes</label>
          <textarea id={`notes-${inquiry.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={5000} rows={2} placeholder="Visible to admins only" disabled={isPending} />
        </div>
      </div>

      <div className="inquiry-actions">
        <button className="btn-primary" disabled={!dirty || isPending} onClick={() => run(() => updateInquiry(inquiry.id, { status, admin_notes: notes }), 'Saved.')}>
          {isPending ? 'Working…' : 'Save'}
        </button>
        {inquiry.email_status === 'failed' && (
          <button className="btn-secondary" disabled={isPending} onClick={() => run(() => resendInquiryEmail(inquiry.id), 'Notification email sent.')}>
            Resend email
          </button>
        )}
        <button
          className="btn-danger"
          disabled={isPending}
          onClick={() => {
            if (window.confirm(`Permanently delete the enquiry from ${inquiry.name}? This cannot be undone.`)) {
              run(() => deleteInquiry(inquiry.id), 'Deleted.');
            }
          }}
        >
          Delete
        </button>
        {message && (
          <span role="status" className={message.kind === 'ok' ? 'form-ok' : 'error-text'}>
            {message.text}
          </span>
        )}
      </div>
    </article>
  );
}
