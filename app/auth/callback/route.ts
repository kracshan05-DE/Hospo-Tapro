import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logServerError('auth.callback', error);
      return NextResponse.redirect(`${origin}/admin/login`);
    }
  }

  return NextResponse.redirect(`${origin}/admin/dashboard`);
}
