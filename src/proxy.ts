import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Supabase SSR middleware.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session on every request so tokens never go stale.
 *  2. Guard every route under /dashboard — redirect to /auth/login if no
 *     valid session exists.
 *  3. If an authenticated user hits /auth/login, send them to the dashboard
 *     home instead of showing the login page again.
 */
export async function proxy(request: NextRequest) {
  // Start with a plain pass-through response so we can mutate its cookies.
  let response = NextResponse.next({ request });

  // ── Build a server-side Supabase client that reads/writes the response
  //    cookies, which is how @supabase/ssr propagates refreshed tokens to
  //    the browser on every request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First write the cookies into the *request* so the server
          // components downstream see the refreshed values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Then rebuild the response so it carries those same cookies back
          // to the browser.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always call getUser() (not getSession()) in middleware.
  // getSession() only reads the local cookie and can be spoofed.
  // getUser() validates the JWT with the Supabase auth server each time.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── 1. Protect /dashboard/** ────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // No valid session — redirect to login, preserving the intended URL
      // so we can redirect back after a successful login if needed.
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirected_from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 2. Skip login page for already-authenticated users ──────────────────
  if (pathname.startsWith('/auth/login') && user) {
    // They are already logged in — send them to the dashboard root.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── 3. Pass through (with potentially refreshed session cookies) ─────────
  return response;
}

export const config = {
  // This matcher tells Next.js exactly which routes to run the proxy on.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (our public login/register pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
