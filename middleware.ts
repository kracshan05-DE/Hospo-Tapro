import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Guards the shared admin section for BOTH brands. This is the app-layer
// backstop; Supabase Row Level Security on `inquiries` and `products` is the
// real security boundary, but this stops an unauthenticated visitor from ever
// seeing the dashboard shell render in the first place, and keeps the
// session cookie refreshed on every request (required by @supabase/ssr).
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith('/admin/dashboard');
  const isLogin = path.startsWith('/admin/login');

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (isLogin && user) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
