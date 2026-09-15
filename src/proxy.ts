import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// ─── Role → canonical dashboard path ────────────────────────────────────────
const ROLE_PATHS: Record<string, string> = {
  admin: '/dashboard/admin/staff',
  doctor: '/dashboard/doctor',
  receptionist: '/dashboard/receptionist',
};

// ─── Role → path prefix allowed to visit ────────────────────────────────────
// Admin can visit any /dashboard/admin/** sub-route, and /dashboard/doctor
const ROLE_PREFIXES: Record<string, string[]> = {
  admin: ['/dashboard/admin', '/dashboard/doctor'],
  doctor: ['/dashboard/doctor'],
  receptionist: ['/dashboard/receptionist'],
};

/**
 * Supabase SSR proxy (Next.js 16 — replaces deprecated middleware.ts).
 *
 * Responsibilities:
 *  1. Refresh the Supabase session on every request so tokens never go stale.
 *  2. Guard every route under /dashboard — redirect to /login if no valid
 *     session exists.
 *  3. Enforce strict role isolation inside /dashboard:
 *       admin       → /dashboard/admin
 *       doctor      → /dashboard/doctor
 *       receptionist → /dashboard/receptionist
 *  4. If an authenticated user hits /login, send them to their dashboard.
 *  5. Allow Meta's WhatsApp webhook to pass through without auth checks.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 0. Bypass for webhooks ───────────────────────────────────────────────
  if (pathname.startsWith('/api/webhooks/whatsapp')) {
    return NextResponse.next();
  }

  // Start with a plain pass-through response so we can mutate its cookies.
  let response = NextResponse.next({ request });

  // ── Build a server-side Supabase client that reads/writes cookies.
  //    This is how @supabase/ssr propagates refreshed tokens on every request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies into the *request* so server components see them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild response so the browser receives the refreshed cookies.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always use getUser() (not getSession()) — it validates the JWT
  // with the Supabase auth server each time and cannot be spoofed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 1. Protect /dashboard/** ─────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // No valid session — redirect to login, preserving the intended URL.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirected_from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── 2. Role-based strict isolation ────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role as string | undefined) ?? 'receptionist';
    const canonicalPath = ROLE_PATHS[role] ?? '/dashboard/receptionist';
    const allowedPrefixes = ROLE_PREFIXES[role] ?? ['/dashboard/receptionist'];

    // If the user is on a dashboard path that doesn't belong to their role,
    // redirect them to their canonical landing page.
    const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix));
    if (!isAllowed) {
      return NextResponse.redirect(new URL(canonicalPath, request.url));
    }
  }

  // ── 3. Skip login/signup for already-authenticated users ───────────────────
  if ((pathname === '/login' || pathname === '/signup') && user) {
    // Fetch role so we redirect to the right dashboard, not just /dashboard.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = (profile?.role as string | undefined) ?? 'receptionist';
    const canonicalPath = ROLE_PATHS[role] ?? '/dashboard/receptionist';
    return NextResponse.redirect(new URL(canonicalPath, request.url));
  }

  // ── 4. Pass through (with potentially refreshed session cookies) ──────────
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static  (static files)
     * - _next/image   (image optimisation files)
     * - favicon.ico   (favicon file)
     * - api/webhooks/whatsapp (Meta's webhook — also bypassed above)
     *
     * NOTE: /login, /signup, /forgot-password, /update-password are intentionally
     * NOT excluded here — the proxy must run on them so authenticated users are
     * redirected away from auth pages to their dashboard.
     */
    '/((?!_next/static|_next/image|favicon\.ico|api/webhooks/whatsapp).*)',
  ],
};