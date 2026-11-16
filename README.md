# Hospo Fresh Group — Website

One Next.js 15 (App Router) application serving both brands, with a shared,
Supabase-backed admin area. Hosted on Vercel.

| Path | What it is |
|---|---|
| `/` | Hospo Fresh public site (contact form) |
| `/tapro` | Tapro public site (product collection from the database, contact form) |
| `/privacy` | Privacy policy (both brands) |
| `/admin/login` | Admin sign-in (email + password) |
| `/admin/dashboard/inquiries` | All enquiries: search, brand/status filters, paging, status + notes, CSV, resend email |
| `/admin/dashboard/tapro` | Tapro product manager (add / edit / delete, photo upload) |
| `/admin/account` | Change password |
| `/admin/forgot-password` | Password reset by email |
| `/api/keep-alive` | Daily Vercel Cron job that stops Supabase pausing the free project |

## Architecture

- **Next.js 15 + React 19** on Vercel. Public pages and the admin are separate
  root layouts (`app/(hospo)`, `app/(tapro)`, `app/(admin)`) so each has its
  own CSS and fonts with no style bleed.
- **Supabase**: Postgres (products, inquiries, admin_users, admin_audit_log),
  Auth (email/password only, public sign-up disabled), Storage
  (`product-images`, public read).
- **Security is enforced in the database** with Row Level Security; the app's
  checks are a second layer, not the only one. See
  `supabase/migrations/20261116130000_admin_security_and_inquiry_management.sql`.
  - Only users listed in `public.admin_users` are admins (`public.is_admin()`).
    Nobody can change that list from the website or the API.
  - Visitors can only read products and view product images.
  - Enquiries are inserted only by the server (service-role key) after
    validation, Cloudflare Turnstile and rate limiting. Admins can read them
    and change only `status` / `admin_notes`; the customer's submission can't
    be edited.
  - The audit log is written by database triggers.
- **Enquiry flow**: validate → save → respond to visitor → send the
  notification email (Resend) *after* the response. Email failures are
  recorded on the row (`email_status = 'failed'`) and can be re-sent from the
  dashboard; an enquiry is never lost because of email.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Checks

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm test            # unit tests (validation, email, "saved even if email fails")
npm run build       # production build
# Database security tests (needs a local PostgreSQL; creates a throwaway DB):
PGHOST=... PGPORT=... PGUSER=postgres npm run test:db
```

`supabase/tests/rls.test.sh` rebuilds the live schema as it was before the
security migration, applies the migration, and checks — as an anonymous
visitor, a signed-in non-admin, an admin and the server — what each can and
cannot do, then proves the rollback restores the original policies.

## Environment variables

See `.env.example`. Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
`TURNSTILE_SECRET_KEY`, `CRON_SECRET`) are set only in Vercel and never
committed.

## Operations

Adding/removing administrators, database changes, backups and rollback:
see [`docs/OPERATIONS.md`](docs/OPERATIONS.md).
