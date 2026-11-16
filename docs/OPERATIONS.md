# Operations guide

Everything below is done by the **infrastructure owner** in the Supabase
dashboard. Admins never need Supabase, Vercel or GitHub access.

## Administrators

Admins are rows in `public.admin_users`. Being able to log in is not enough:
an account with no row there is refused everywhere (website and database).

### Add an administrator
1. Supabase → **Authentication → Users → Add user → Create new user**.
   Enter their email and a temporary password, tick **Auto Confirm User**.
2. Supabase → **SQL Editor**, run (replace the email):
   ```sql
   insert into public.admin_users (user_id, email, role, must_change_password)
   select id, email, 'admin', true from auth.users where email = 'friend@example.com';
   ```
3. Send them the site's `/admin/login` link, and the temporary password through
   a **different** channel (e.g. phone). On first login they must choose a
   new password before they can do anything else.

Use `role = 'owner'` only for the infrastructure owner. Both roles have the
same website permissions; `owner` just records who is responsible.

### Remove an administrator (takes effect immediately)
```sql
delete from public.admin_users where email = 'friend@example.com';
```
Optionally also delete or ban the login in **Authentication → Users**.

### See who the administrators are
```sql
select email, role, must_change_password, created_at from public.admin_users order by created_at;
```

### Forgotten password
Admins use **Forgot your password?** on the login page. This needs custom
SMTP configured (Supabase → Authentication → Emails → SMTP Settings): Supabase's
built-in email only delivers to the project's own team members.

## Audit log
Product changes and enquiry status/notes changes/deletions are recorded
automatically:
```sql
select created_at, actor_email, action, details from public.admin_audit_log order by created_at desc limit 50;
```

## Database changes
- Migrations live in `supabase/migrations/`, each with a rollback script in
  `supabase/rollbacks/`. Run them in the Supabase SQL Editor.
- Before any migration, take a backup (below). Test it locally first with
  `npm run test:db`.

## Backups
The free Supabase plan has no downloadable backups, so take your own:
- Quick: Table Editor → each table → Export → CSV; Storage → `product-images`
  → download.
- Full: `npx supabase@latest db dump --db-url "<Session pooler URL>" -f data.sql --use-copy --data-only`
  (plus `--role-only` and schema dumps). Store backups privately — they
  contain customer data. Never commit them.

## Rollback
- **App**: Vercel → Deployments → previous production deployment → **Promote**
  (instant).
- **Database**: run the matching file from `supabase/rollbacks/` in the SQL
  Editor. Rolling back the security migration reopens the old holes, so only
  do it together with promoting the previous app version, and re-apply the fix
  as soon as possible.

## Keeping the database awake
`/api/keep-alive` runs daily (Vercel Cron, `vercel.json`). If the site shows
"collection temporarily unavailable", check Supabase for a paused project and
Vercel → Logs for `keep-alive` errors.
