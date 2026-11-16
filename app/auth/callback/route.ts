import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';
import { RESET_COOKIE, RESET_COOKIE_MAX_AGE } from '@/lib/auth-constants';

// Only allow redirects to our own admin pages (prevents open redirects).
function safeNext(next: string | null): string {
  return next && /^\/admin(\/[a-z0-9-]*)*$/i.test(next) ? next : '/admin/dashboard';
}

// Handles links from Supabase auth emails (password reset, invites).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (!code) return NextResponse.redirect(`${origin}/admin/login`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    logServerError('auth.callback', error ?? 'no user');
    return NextResponse.redirect(`${origin}/admin/login?error=link-expired`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  if (next === '/admin/reset-password') {
    response.cookies.set(RESET_COOKIE, data.user.id, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: RESET_COOKIE_MAX_AGE,
    });
  }
  return response;
}
