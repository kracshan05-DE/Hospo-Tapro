// Content-Security-Policy for the public pages, delivered as a <meta> tag in
// each root layout.
//
// Why <meta> instead of a response header: Netlify does not document how two
// overlapping header rules (e.g. "/*" and "/admin/*") combine. If both sent a
// CSP, the browser would enforce both, and the stricter public policy would
// break the Decap admin. A per-page <meta> keeps each page's policy separate:
// the public site gets this one, and public/admin/index.html gets its own.
// Clickjacking protection (frame-ancestors) cannot be set via <meta>, so it
// comes from the X-Frame-Options header in netlify.toml instead.
//
// 'unsafe-inline' on script-src/style-src: Next.js inlines its hydration
// payload in <script> tags and the components use inline style props. A
// nonce-based policy needs a server per request, which a static site has none
// of. There is no user-generated HTML on these pages, which keeps XSS risk low.
const isDev = process.env.NODE_ENV === 'development';

export const SITE_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://images.unsplash.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');
