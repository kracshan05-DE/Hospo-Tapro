import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Service-role client. BYPASSES Row Level Security, so it is used only for
// the few server-side operations that must not be exposed to browsers:
//   - saving public contact-form inquiries (anon inserts are blocked in the DB)
//   - recording email delivery status
//   - clearing an admin's must_change_password flag
// `server-only` makes the build fail if this file is ever imported into
// client code, so the key can never be bundled into the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are not configured.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
