import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Session-aware Supabase client for Server Components, Server Actions and
// Route Handlers. Uses the public anon key + the user's session cookie, so
// every query is subject to Row Level Security as that user.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render, where cookies are
            // read-only; the middleware refreshes the session instead.
          }
        },
      },
    }
  );
}
