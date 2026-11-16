'use server';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getAdmin } from '@/lib/admin';
import { logServerError } from '@/lib/log';
import { isRateLimited } from '@/lib/rate-limit';
import { EMAIL_RE, validateNewPassword } from '@/lib/validation';
import { RESET_COOKIE } from '@/lib/auth-constants';

export type AuthResult = { ok: true } | { ok: false; error: string };

async function clientIp() {
  return (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  if (await isRateLimited(`login:${await clientIp()}`)) {
    return { ok: false, error: 'Too many attempts. Please wait a minute and try again.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Same message for every failure, so the form can't be used to discover
    // which email addresses have accounts.
    logServerError('auth.login', error);
    return { ok: false, error: 'Incorrect email or password.' };
  }

  // A valid login is not enough: the account must also be an administrator.
  const admin = await getAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, error: 'This account does not have admin access.' };
  }
  return { ok: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

// Change password while signed in. Requires the current password, so a
// session left open on a shared computer can't be used to take over the account.
export async function changePassword(formData: FormData): Promise<AuthResult> {
  const admin = await getAdmin();
  if (!admin?.user.email) return { ok: false, error: 'Please sign in again.' };

  const current = String(formData.get('current_password') || '');
  const next = String(formData.get('new_password') || '');
  const confirm = String(formData.get('confirm_password') || '');

  const problem = validateNewPassword(next, confirm);
  if (problem) return { ok: false, error: problem };
  if (next === current) return { ok: false, error: 'Choose a password different from the current one.' };

  if (await isRateLimited(`pwchange:${admin.user.id}`)) {
    return { ok: false, error: 'Too many attempts. Please wait a minute and try again.' };
  }

  const { error: verifyError } = await admin.supabase.auth.signInWithPassword({
    email: admin.user.email,
    password: current,
  });
  if (verifyError) return { ok: false, error: 'Your current password is incorrect.' };

  return applyNewPassword(admin.supabase, admin.user.id, next);
}

// Set a new password after following a password-reset email link. Allowed
// only within 15 minutes of the reset link being opened (see /auth/callback).
export async function setPasswordAfterReset(formData: FormData): Promise<AuthResult> {
  const cookieStore = await cookies();
  const admin = await getAdmin();
  if (!admin || cookieStore.get(RESET_COOKIE)?.value !== admin.user.id) {
    return { ok: false, error: 'This reset link has expired. Please request a new one.' };
  }

  const next = String(formData.get('new_password') || '');
  const confirm = String(formData.get('confirm_password') || '');
  const problem = validateNewPassword(next, confirm);
  if (problem) return { ok: false, error: problem };

  const result = await applyNewPassword(admin.supabase, admin.user.id, next);
  if (result.ok) cookieStore.delete(RESET_COOKIE);
  return result;
}

async function applyNewPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logServerError('auth.updatePassword', error);
    const weak = /weak|short|characters|pwned|leaked/i.test(error.message);
    return { ok: false, error: weak ? error.message : 'Could not update the password. Please try again.' };
  }
  try {
    const { error: flagError } = await createAdminClient()
      .from('admin_users')
      .update({ must_change_password: false })
      .eq('user_id', userId);
    if (flagError) throw flagError;
  } catch (error) {
    logServerError('auth.clearPasswordFlag', error);
  }
  return { ok: true };
}

// Always reports success, whether or not the email has an account, so the
// form can't be used to discover admin email addresses.
export async function requestPasswordReset(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' };

  if (await isRateLimited(`pwreset:${await clientIp()}`)) {
    return { ok: false, error: 'Too many requests. Please wait a minute and try again.' };
  }

  // The link returns to the site the request came from. Supabase only honours
  // redirect URLs on the project's allow-list, so a forged Host header can't
  // send the link anywhere else.
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/admin/reset-password`,
  });
  if (error) logServerError('auth.resetPassword', error);
  return { ok: true };
}
