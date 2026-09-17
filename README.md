# Hospo Fresh Group — Unified App

One Next.js 14 (App Router) application serving both brands, with a shared
Supabase-backed admin section.

## Routes

| Path                          | What it is                                              |
|--------------------------------|----------------------------------------------------------|
| `/`                             | Hospo Fresh public marketing site                        |
| `/tapro`                        | Tapro public marketing site                               |
| `/admin/login`                  | Shared sign-in (email/password or Google) for both brands |
| `/admin/dashboard/hospo-fresh`  | Hospo Fresh enquiries (paginated, CSV export)             |
| `/admin/dashboard/tapro`        | Tapro product manager + Tapro enquiries                   |

## Why three root layouts?

Hospo Fresh, Tapro, and the admin section each have their own
`layout.tsx` that renders its own `<html>`/`<body>`, via Next.js route
groups: `app/(hospo)/`, `app/(tapro)/tapro/`, `app/(admin)/admin/`.

This is the deliberate fix for the biggest risk in merging two
independently-styled sites into one app: both original codebases defined
global CSS custom properties and admin class names (`--green`, `--gold`,
`.admin-shell`, `.login-card`, `.btn-primary`, etc.) with **different
values for the same names**. A single shared `globals.css` would have
silently broken one brand's admin styling or the other's public site the
moment both were mounted in the same document. Separate root layouts give
each brand (and the shared admin tool) its own isolated stylesheet and
font set, and force a full document navigation between `/` and `/tapro`
instead of a soft client-side transition that could otherwise leak styles.

## What changed vs. the original two codebases

**Security (see the original code review):**
- Added `middleware.ts` (was missing from Hospo Fresh) refreshing the
  Supabase session and gating `/admin/dashboard/*` for both brands.
- Added an explicit `if (!user) redirect('/admin/login')` inside each
  dashboard page as defense-in-depth, in case the middleware matcher is
  ever edited.
- Fixed CSV/formula injection in the enquiries export (`lib/csv.ts`) —
  cells starting with `= + - @` are now prefixed with `'` before export.
- Added a honeypot + submission-speed heuristic to **both** contact forms
  (Tapro's had neither) and a best-effort in-memory rate limiter
  (`lib/rate-limit.ts` — read its comment; swap in Upstash + Turnstile
  before a high-traffic public launch).
- Server actions now log real errors server-side (`lib/log.ts`) instead of
  swallowing them, while still returning generic messages to the client.
- Tightened server-side validation on all form/product inputs (length
  caps, image URL must point at our own Storage bucket).

**Data model:**
- Hospo Fresh's `hospo_inquiries` and Tapro's `inquiries` tables are
  merged into one `inquiries` table with a `brand` column — see
  `supabase/schema.sql` for the schema and a migration script for existing
  data.
- Tapro's contact-form submissions previously had **no admin view at
  all** — they went into the database with nobody able to read them
  through the UI. Fixed: they now show up in the Tapro dashboard.

**Consistency:**
- One shared login page, one shared `logout()`/`login()` action, one
  Supabase client pair (`lib/supabase-server.ts` / `lib/supabase-browser.ts`).
- A single admin design system (`app/admin.css`) replaces the two
  independently-built (and colliding) admin skins.
- Cross-links between the sites (`Header.tsx` in each) now point at the
  internal `/` and `/tapro` routes instead of hardcoded external
  `*.vercel.app` URLs.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL/anon key.
3. Run `supabase/schema.sql` in the Supabase SQL editor (adjust if migrating existing data — see the note at the bottom of that file).
4. Create a **public** Storage bucket named `product-images`.
5. If using Google sign-in, enable the Google provider in Supabase Auth and set the authorized redirect URI to `<your-domain>/auth/callback`.
6. `npm run dev`

## Round 2 — closing the "safe for public traffic" gaps

The first version fixed the specific vulnerabilities from the code review
(auth bypass, CSV injection, missing Tapro admin view). It was **not** yet
what I'd call production-grade for real public traffic. This round closes
the gaps that actually matter at this scale, and explicitly skips the ones
that don't.

**Added, because they were real gaps:**
- `lib/rate-limit.ts` now uses Upstash Redis. The previous in-memory version
  does not work on serverless — each request can land on a different,
  memory-isolated instance, so it was rate-limiting almost nothing. Set
  `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (free tier) before
  launch, or you're back to no real protection.
- Cloudflare Turnstile (`lib/turnstile.ts`, `components/shared/TurnstileWidget.tsx`)
  on both contact forms. The honeypot + timing check only stopped the
  laziest bots; this is the layer that stops a real scripted spammer.
- Security headers + a CSP in `next.config.js` (HSTS, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy). Read the comment
  above the CSP constant — it documents an honest tradeoff (`'unsafe-inline'`
  on script-src/style-src) rather than pretending it's a strict nonce-based
  policy, and says exactly why and what a stricter version would require.
- `next/image` remotePatterns and the CSP's `img-src` are now pinned to your
  actual Supabase project hostname (parsed from `NEXT_PUBLIC_SUPABASE_URL`
  at build time) instead of a `*.supabase.co` wildcard.
- A privacy policy page (`/privacy`, linked from both brands' footers and
  both contact forms) — you're collecting name/email/phone through public
  forms with no disclosure anywhere, which is a real compliance gap, not a
  cosmetic one.
- An admin audit log (`admin_audit_log` table + `lib/audit.ts`) recording
  who created/edited/deleted a product and when. No UI was built for it on
  purpose — query it directly in Supabase's Table Editor when needed; a
  full audit viewer would be over-engineering for one admin user.
- `.github/workflows/ci.yml` — typecheck + build on every PR. This is the
  floor, not a full test suite (see below).
- Mobile responsiveness pass on the admin dashboard specifically (the topbar,
  product rows, and login card didn't have their own mobile breakpoints —
  the public sites already did).

**Deliberately not added — this would be over-engineering at this scale:**
- **Nonce-based strict CSP.** The right long-term answer, but it requires
  threading a per-request nonce through every layout and script tag, and
  getting it wrong silently breaks the site (blank page) in a way I can't
  verify without a live browser test against your real deployment. Ship the
  pragmatic CSP above; revisit this if the app starts handling anything more
  sensitive than contact-form enquiries.
- **MFA on admin login.** Supabase supports it if you ever want it, but for
  a single admin user it's friction without much real payoff yet.
- **Cookie-consent banner.** This app sets no tracking or advertising
  cookies — only the functional Supabase auth session cookie, which is
  exempt from consent requirements under GDPR/ePrivacy as "strictly
  necessary." A banner here would be theater. Turnstile's own data use is
  disclosed on the `/privacy` page instead.
- **A full automated test suite.** Worth doing as the app grows past two
  brands and one admin; not worth blocking this launch on. CI currently
  gates on typecheck + build, which catches the class of bug most likely to
  actually ship (broken imports, type mismatches, a route that fails to
  render).
- Replacing the two `<img>` tags in the Hospo Fresh header/footer with
  `next/image` — they're small static logo assets with no meaningful
  optimization to gain.

## Setup, round 2 additions

7. Sign up for [Upstash](https://upstash.com) (free tier), create a Redis database, and set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
8. Sign up for [Cloudflare Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (free), create a widget for your domain, and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`.
