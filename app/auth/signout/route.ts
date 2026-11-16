import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Ends the session (clears Supabase auth cookies) and returns to the login
// page, carrying a known error code only.
const ALLOWED = new Set(['not-authorised']);

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  const error = searchParams.get('error');
  const qs = error && ALLOWED.has(error) ? `?error=${error}` : '';
  return NextResponse.redirect(`${origin}/admin/login${qs}`);
}
