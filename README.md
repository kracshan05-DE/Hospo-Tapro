# Hospo Fresh Group website

One Next.js app serving two brand sites, built as a **static site** and hosted
on **Netlify**. There is no database, no server code and no custom login.

| Path      | What it is                                         |
| --------- | -------------------------------------------------- |
| `/`       | Hospo Fresh public site                            |
| `/tapro`  | Tapro public site                                  |
| `/privacy`| Shared privacy policy                              |
| `/admin/` | Tapro product admin (Decap CMS, GitHub login)      |

## How it works

| Need | How it is done |
| --- | --- |
| Product catalogue | `content/products.json` in this repo, photos in `public/products/`. Read at build time. |
| Editing products | Decap CMS at `/admin/`. Saving commits to GitHub; Netlify rebuilds (live in 1–2 minutes). |
| Admin login | GitHub accounts with **write access to this repo**. Nothing else can sign in. |
| Contact forms | Netlify Forms (`hospo-enquiry`, `tapro-enquiry`). Stored in Netlify, emailed to the team. |
| Spam | Netlify honeypot field + Akismet filtering. |
| Hosting | `next build` writes static files to `out/`; Netlify serves them from its CDN. |

Why no database: products change a few times a year and look the same to every
visitor, so they are content, not live data. Enquiries are rare and only need to
reach a person. Removing the server removes the whole class of runtime risks
(auth bypass, data exposure, a paused database taking the site down).

### Important files

| File | Purpose |
| --- | --- |
| `content/products.json` | The Tapro product list, in display order. |
| `public/admin/config.yml` | Decap CMS setup: repo, fields, image folder. |
| `public/admin/index.html` | Admin page. Loads Decap pinned to 3.16.3 with an integrity hash. |
| `public/__forms.html` | Hidden copies of both forms so Netlify can detect them. Keep field names in sync with the React forms. |
| `lib/enquiry.ts` | Form validation and submission to Netlify. |
| `lib/products.ts` | Loads and checks `products.json`; a malformed file fails the build instead of breaking the live site. |
| `lib/csp.ts` | Content-Security-Policy for public pages. |
| `netlify.toml` | Build settings, security headers, old admin URL redirects. |

## Day-to-day: editing products

1. Go to `https://<your-domain>/admin/` and choose **Login with GitHub**.
2. Open **Tapro → Products**. Add, edit, delete, or drag to reorder.
3. Press **Publish**. The live site updates in about 1–2 minutes.

Photos: JPEG, PNG or WebP, under 1 MB, about 1200 px wide; portrait (4:5) crops best.
The site shows photos exactly as uploaded, so oversized files slow it down.

Each publish is one Netlify production build. Batch several edits into one
publish where you can, to stay well inside the free plan's monthly credits.

To add another admin: GitHub → this repo → **Settings → Collaborators** → invite
their GitHub account with write access. Remove them the same way.

## Day-to-day: enquiries

Netlify dashboard → your site → **Forms**. Each form lists its submissions;
the **⋯** menu exports CSV. Email alerts are set in **Forms → Form notifications**.

## One-time setup on Netlify

Do these in an account owned by you or the business, never a shared password.

1. **Create the site.** Sign up at netlify.com with *Sign up with GitHub*.
   **Add new site → Import an existing project → GitHub → `hospo-tapro`.**
   Build settings come from `netlify.toml`; leave them as detected.
2. **Check it** on the `*.netlify.app` address: both brands, `/privacy`, and a
   test enquiry from each form.
3. **Enable forms** if needed: **Forms → Enable form detection**, then
   redeploy (**Deploys → Trigger deploy**). Both `hospo-enquiry` and
   `tapro-enquiry` should appear under Forms.
4. **Email alerts:** **Forms → Form notifications → Add notification → Email**,
   to `info@hospofresh.com.au`, once for each form.
5. **Admin login (GitHub OAuth):**
   1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
      Homepage URL: your site URL. Authorization callback URL:
      `https://api.netlify.com/auth/done`.
   2. Copy the **Client ID** and generate a **Client secret**.
   3. Netlify → **Site configuration → Access & security → OAuth → Install provider →
      GitHub**, paste both values.
   4. Open `/admin/`, sign in, and publish a small test edit.
6. **Turn on two-factor authentication** on the GitHub and Netlify accounts.
   Together they are the whole security boundary.
7. **Make the repo private** (GitHub → Settings → General → Danger Zone).
   Decap and Netlify both work with private repos.

### Connecting the GoDaddy domain

1. The previous host removes the domain from their Netlify site.
2. In this site: **Domain management → Add a domain**. Make `www` the primary
   domain (Netlify recommends this with external DNS). If asked to verify
   ownership, add the TXT record it shows in GoDaddy.
3. In GoDaddy → **DNS**: first confirm the nameservers are GoDaddy's. Then:

   | Type  | Name  | Value                         |
   | ----- | ----- | ----------------------------- |
   | A     | `@`   | `75.2.60.5`                   |
   | CNAME | `www` | `<your-site-name>.netlify.app` |

   Delete any other `A`/`AAAA` records on `@` (GoDaddy's "parked" record breaks this).
4. Netlify issues the HTTPS certificate automatically once DNS resolves
   (minutes, up to 48 hours).

## Migrating data out of Supabase (one time)

Resume the paused project in the Supabase dashboard first, then:

**Products.** In the SQL editor, run:

```sql
select json_build_object(
  'products',
  coalesce(json_agg(
    json_strip_nulls(json_build_object(
      'name', name,
      'volume', nullif(volume, ''),
      'description', nullif(description, ''),
      'image', nullif(regexp_replace(image_url, '^.*/product-images/', '/products/'), '')
    )) order by sort_order
  ), '[]'::json)
) as products_json
from public.products;
```

Copy the result into `content/products.json`. Then **Storage → product-images**,
download every file, and upload them unchanged into `public/products/` (on
GitHub: open the folder → **Add file → Upload files**). File names must match the
`image` paths in the JSON.

**Enquiries.** **Table Editor → inquiries → Export → CSV**. Keep this file
private (not in this repo): it contains customer personal data.

When the new site is live and both exports are safely stored, delete the
Supabase project and the old Vercel project.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000 and /tapro
npm run build        # static site in out/
npm run lint && npm run typecheck
```

- **Forms** only work on Netlify (locally they show the "could not be sent"
  message). To test them locally, use the Netlify CLI: `npx netlify dev`.
- **Admin locally:** run `npm run cms` in a second terminal, then open
  `http://localhost:3000/admin/index.html`. Edits write to your local files
  instead of GitHub.

## Design notes

- **Three root layouts.** Hospo Fresh (`app/(hospo)`) and Tapro
  (`app/(tapro)/tapro`) each have their own `<html>`, stylesheet and fonts, so
  their identically named CSS variables never collide.
- **CSP via `<meta>`.** Netlify does not document how overlapping header rules
  combine, and the admin needs a looser policy than the public pages. Each page
  therefore carries its own policy; see `lib/csp.ts`.
- **Self-hosted fonts** (`app/fonts`, SIL Open Font License): the build never
  depends on Google Fonts, and visitors make no requests to Google.

## Known limitations

- Next.js 14 is past its support window. As a static export it only runs at
  build time on our own code, which removes the runtime risks in its security
  advisories. Upgrading to a current major is still recommended as a follow-up.
- No server-side form validation (there is no server). Browser validation helps
  genuine visitors; spam is handled by Netlify's filters. Netlify also supports
  reCAPTCHA if spam ever becomes a problem.
- Photos on the Hospo Fresh site are hotlinked from Unsplash. Self-host the
  ones you keep.
- The Tapro logo in the Hospo Fresh header is cropped from the hero artwork
  (120×49 px), so it is slightly soft on high-density screens. Replace
  `public/tapro-logo.png` with the original logo file (SVG or 2× PNG) when available.
