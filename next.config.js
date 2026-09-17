// Pin the Supabase Storage hostname to the actual project instead of a
// wildcard `*.supabase.co` — narrows both next/image's remotePatterns and
// the CSP img-src below to exactly the one project this app talks to.
function supabaseHostname() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname;
  } catch {
    return null; // no env at config-eval time (e.g. CI without secrets) — fall back below
  }
}

const supabaseHost = supabaseHostname();
const supabaseImagePattern = supabaseHost
  ? { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }
  : { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' };
const supabaseConnectSrc = supabaseHost ? `https://${supabaseHost}` : 'https://*.supabase.co';

// A pragmatic, non-nonce Content-Security-Policy. Honest tradeoff, not a
// gold-standard one: script-src and style-src include 'unsafe-inline'
// because (a) Next.js App Router streams RSC payloads via inline <script>
// tags at runtime, and (b) this codebase uses React's `style={{...}}` inline
// style props throughout — both would break under a strict nonce-based CSP
// without threading a per-request nonce through every layout and component.
// This still blocks the two things that matter most for a marketing site
// with public forms: loading a THIRD-PARTY script/stylesheet an attacker
// injected, and framing the site elsewhere. A stricter nonce-based CSP is a
// documented follow-up in the README if this app's risk profile changes.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost ?? '*.supabase.co'} https://images.unsplash.com`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseConnectSrc} https://challenges.cloudflare.com`,
  'frame-src https://challenges.cloudflare.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [supabaseImagePattern],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
