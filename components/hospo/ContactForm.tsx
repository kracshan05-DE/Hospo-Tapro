'use client';

import { useEffect, useRef } from 'react';
import { useEnquiryForm } from '@/lib/enquiry';

const FORM = 'hospo-enquiry';

export default function ContactForm() {
  const { status, errors, onSubmit, fieldProps } = useEnquiryForm(FORM);
  const thanksRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the confirmation so screen-reader and keyboard users know
  // the enquiry went through (the form itself disappears).
  useEffect(() => {
    if (status === 'sent') thanksRef.current?.focus();
  }, [status]);

  if (status === 'sent') {
    return (
      <p className="form-status" role="status" tabIndex={-1} ref={thanksRef}>
        Thank you — your enquiry has been submitted. Our team will be in touch soon.
      </p>
    );
  }

  const err = (name: keyof typeof errors) =>
    errors[name] ? (
      <span className="field-error" id={`${FORM}-${name}-error`}>
        {errors[name]}
      </span>
    ) : null;

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-label="Wholesale enquiry">
      {/* Honeypot: hidden from people and assistive tech; bots that fill it
          are discarded by Netlify (netlify-honeypot in public/__forms.html). */}
      <div className="hp" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="field">
        <label htmlFor="hf-name" className="sr-only">Your name</label>
        <input id="hf-name" name="name" placeholder="Your name" autoComplete="name" maxLength={200} required {...fieldProps('name')} />
        {err('name')}
      </div>
      <div className="field">
        <label htmlFor="hf-email" className="sr-only">Email address</label>
        <input id="hf-email" name="email" type="email" placeholder="Email address" autoComplete="email" maxLength={254} required {...fieldProps('email')} />
        {err('email')}
      </div>
      <div className="field">
        <label htmlFor="hf-business" className="sr-only">Business name (optional)</label>
        <input id="hf-business" name="business" placeholder="Business name" autoComplete="organization" maxLength={200} />
      </div>
      <div className="field">
        <label htmlFor="hf-phone" className="sr-only">Phone number (optional)</label>
        <input id="hf-phone" name="phone" type="tel" placeholder="Phone number" autoComplete="tel" maxLength={40} {...fieldProps('phone')} />
        {err('phone')}
      </div>
      <div className="field full">
        <label htmlFor="hf-enquiry" className="sr-only">Enquiry type</label>
        <select id="hf-enquiry" name="enquiry" defaultValue="">
          <option value="">Enquiry type</option>
          <option>Wholesale enquiry</option>
          <option>Product enquiry</option>
          <option>Catalogue request</option>
          <option>Distribution enquiry</option>
          <option>General enquiry</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor="hf-message" className="sr-only">How can we help?</label>
        <textarea id="hf-message" name="message" placeholder="How can we help?" maxLength={5000} required {...fieldProps('message')} />
        {err('message')}
      </div>

      <p className="form-note">
        By submitting, you agree to our <a href="/privacy">Privacy Policy</a>.
      </p>
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
      </button>
      <p className="form-error" role="alert">
        {status === 'error' && (
          <>
            Sorry, your enquiry could not be sent. Please try again, or email us at{' '}
            <a href="mailto:info@hospofresh.com.au">info@hospofresh.com.au</a>.
          </>
        )}
      </p>
    </form>
  );
}
