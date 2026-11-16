import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logServerError } from '@/lib/log';

// Called once a day by Vercel Cron (see vercel.json). Supabase pauses free
// projects after 7 days without activity, which takes the whole site down;
// one tiny read a day keeps the project active. Doubles as a health check:
// it returns 503 if the database is unreachable, which shows up in Vercel's
// cron logs.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    logServerError('keep-alive', error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
