import 'server-only';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from './supabase-server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type AdminContext = {
  supabase: Supabase;
  user: User;
  role: 'owner' | 'admin';
  mustChangePassword: boolean;
};

// Returns the signed-in administrator, or null if the visitor is not signed
// in or is signed in but not listed in public.admin_users. The database's RLS
// policies are the real security boundary; this check gives a clean UX and
// stops non-admin sessions reaching admin pages or actions at all.
export async function getAdmin(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('admin_users')
    .select('role, must_change_password')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    supabase,
    user,
    role: data.role as AdminContext['role'],
    mustChangePassword: data.must_change_password === true,
  };
}

// For admin pages: redirects instead of rendering for anyone who isn't an admin.
export async function requireAdminPage(options: { allowPendingPasswordChange?: boolean } = {}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const admin = await getAdmin();
  if (!admin) {
    // Signed in, but not an administrator. Pages can't clear cookies while
    // rendering, so end the session in a route handler.
    redirect('/auth/signout?error=not-authorised');
  }
  if (admin.mustChangePassword && !options.allowPendingPasswordChange) {
    redirect('/admin/account?first=1');
  }
  return admin;
}
