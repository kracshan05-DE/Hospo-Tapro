import { logServerError } from './log';

// Verifies a Cloudflare Turnstile token server-side. Turnstile is free,
// invisible-by-default, and doesn't need the visual puzzle-solving UX of
// reCAPTCHA — it's the right tool for "stop scripted spam on a public form",
// which the honeypot + timing check alone cannot do against a real bot.
//
// If NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY aren't set, this
// no-ops (returns true) so local development works without a Cloudflare
// account — but it means the form has NO bot protection beyond the
// honeypot/timing heuristic until these are configured. Set them before a
// public launch.
export async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — skipping bot verification.');
    }
    return true;
  }
  if (!token) return false;

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    logServerError('turnstile.verify', error);
    // Fail closed: if Cloudflare's endpoint is unreachable, treat as
    // unverified rather than silently letting every submission through.
    return false;
  }
}
