'use client';

import { useEffect, useRef } from 'react';
import Reveal from './Reveal';
import { useEnquiryForm } from '@/lib/enquiry';

const FORM = 'tapro-enquiry';

export default function Contact() {
  const { status, errors, onSubmit, fieldProps } = useEnquiryForm(FORM);
  const btnRef = useRef<HTMLButtonElement>(null);
  const thanksRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (status === 'sent') thanksRef.current?.focus();
  }, [status]);

  function handleMagnet(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = btnRef.current;
    if (!btn || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.35;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    btn.style.transform = `translate(${x}px, ${y}px)`;
  }
  function resetMagnet() {
    if (btnRef.current) btnRef.current.style.transform = 'translate(0,0)';
  }

  const err = (name: keyof typeof errors) =>
    errors[name] ? (
      <span className="field-error" id={`${FORM}-${name}-error`}>
        {errors[name]}
      </span>
    ) : null;

  return (
    <section id="contact" aria-labelledby="contact-title">
      <div className="inner wrap">
        <Reveal delay={0} className="eyebrow">
          Get in Touch
        </Reveal>
        <Reveal as="h2" delay={1} id="contact-title">
          Bring Sri Lanka
          <br />
          to your table.
        </Reveal>
        <Reveal as="p" delay={2}>
          For trade enquiries, stockist information, or export partnerships — the Tapro team
          would love to hear from you.
        </Reveal>

        {status === 'sent' ? (
          <p className="form-status" role="status" tabIndex={-1} ref={thanksRef}>
            Thank you — your enquiry has been sent. We&apos;ll be in touch soon.
          </p>
        ) : (
          <Reveal as="form" delay={3} className="contact-form" onSubmit={onSubmit} noValidate aria-label="Tapro enquiry">
            {/* Honeypot: hidden from people and assistive tech. */}
            <div className="hp" aria-hidden="true">
              <label>
                Leave this empty
                <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div>
              <label htmlFor="tf-name">Name</label>
              <input id="tf-name" name="name" type="text" autoComplete="name" required maxLength={200} {...fieldProps('name')} />
              {err('name')}
            </div>
            <div>
              <label htmlFor="tf-email">Email</label>
              <input id="tf-email" name="email" type="email" autoComplete="email" required maxLength={254} {...fieldProps('email')} />
              {err('email')}
            </div>
            <div>
              <label htmlFor="tf-message">Message</label>
              <textarea id="tf-message" name="message" required maxLength={5000} {...fieldProps('message')} />
              {err('message')}
            </div>
            <p className="form-note">
              By submitting, you agree to our <a href="/privacy">Privacy Policy</a>.
            </p>
            <button
              type="submit"
              className="magnet-btn"
              disabled={status === 'sending'}
              ref={btnRef}
              onMouseMove={handleMagnet}
              onMouseLeave={resetMagnet}
            >
              {status === 'sending' ? 'Sending…' : 'Send Enquiry →'}
            </button>
            <p className="error-text" role="alert">
              {status === 'error' && (
                <>
                  Sorry, your enquiry could not be sent. Please try again, or email{' '}
                  <a href="mailto:info@hospofresh.com.au">info@hospofresh.com.au</a>.
                </>
              )}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
