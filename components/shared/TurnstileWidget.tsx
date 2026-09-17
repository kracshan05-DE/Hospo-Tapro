'use client';

import Script from 'next/script';

// Renders nothing if no site key is configured (local dev without
// Cloudflare set up) so the form still submits — see lib/turnstile.ts for
// the matching server-side no-op behaviour.
export default function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
      {/* Cloudflare's script finds this div, renders the widget, and injects
          a hidden `cf-turnstile-response` input into the parent <form> automatically. */}
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
    </>
  );
}
