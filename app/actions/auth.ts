'use server';

import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';
import { redirect } from 'next/navigation';

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { ok: false, error: 'Enter your email and password.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Log the real reason server-side; never leak it to the client (avoids
    // user enumeration via distinct "wrong password" vs "no such user" errors).
    logServerError('auth.login', error);
    return { ok: false, error: 'Incorrect email or password.' };
  }
  return { ok: true };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
