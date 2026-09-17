'use client';

import { useRef, useState, useTransition } from 'react';
import { submitHospoInquiry } from '@/app/actions/inquiries';
import TurnstileWidget from '@/components/shared/TurnstileWidget';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();
  const renderedAt = useRef(Date.now());

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitHospoInquiry(formData);
      if (result.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
        setErrorMsg(result.error);
      }
    });
  }

  if (status === 'sent') {
    return <p className="form-status">Thank you — your enquiry has been submitted. Our team will be in touch soon.</p>;
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {/* Honeypot field: real visitors never see or fill this in */}
      <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />
      <input type="hidden" name="form_rendered_at" value={renderedAt.current} />
      <input required name="name" placeholder="Your name" maxLength={200} />
      <input required name="email" type="email" placeholder="Email address" maxLength={254} />
      <input name="business" placeholder="Business name" maxLength={200} />
      <input name="phone" placeholder="Phone number" maxLength={40} />
      <select name="enquiry" defaultValue="">
        <option value="">Enquiry type</option>
        <option>Wholesale enquiry</option>
        <option>Product enquiry</option>
        <option>Catalogue request</option>
        <option>Distribution enquiry</option>
        <option>General enquiry</option>
      </select>
      <textarea required name="message" placeholder="How can we help?" maxLength={5000} />
      <div style={{ gridColumn: '1/-1' }}>
        <TurnstileWidget />
      </div>
      <p style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--muted)', margin: 0 }}>
        By submitting, you agree to our{' '}
        <a href="/privacy" style={{ textDecoration: 'underline' }}>
          Privacy Policy
        </a>
        .
      </p>
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending…' : 'Send Enquiry'}
      </button>
      {status === 'error' && <p className="form-error">{errorMsg}</p>}
    </form>
  );
}
