import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware for Pie Radio Web Application
 * 
 * Handles:
 * 1. Security headers (CSP, HSTS)
 * 2. Supabase session refresh
 * 3. Role-based route protection
 */
export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // =========================================================================
    // 1. Security Headers (CSP, HSTS)
    // =========================================================================
    const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.googleusercontent.com https://i.scdn.co https://cdn.discordapp.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://*.aiir.com https://api.stripe.com;
    media-src 'self' https://*.aiir.com blob:;
    frame-src 'self' https://js.stripe.com;
  `;
    const contentSecurityPolicyHeaderValue = cspHeader
        .replace(/\s{2,}/g, " ")
        .trim();

    response.headers.set(
        "Content-Security-Policy",
        contentSecurityPolicyHeaderValue
    );

    // HSTS
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );

    // =========================================================================
    // 2. Supabase Session Refresh
    // =========================================================================
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // =========================================================================
    // 3. Role-Based Route Protection
    // =========================================================================
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Helper to redirect with preserved redirect URL
    const redirectToLogin = () => {
        url.pathname = "/login";
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    };

    const redirectToUnauthorized = () => {
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
    };

    // -------------------------------------------------------------------------
    // Protect /admin routes - Require ADMIN role
    // -------------------------------------------------------------------------
    if (pathname.startsWith("/admin")) {
        if (!user) {
            return redirectToLogin();
        }

        // Fetch user role from database
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            // User exists but no profile - shouldn't happen with triggers
            console.error('Profile fetch error in middleware:', error);
            return redirectToUnauthorized();
        }

        if (profile.role !== 'admin') {
            return redirectToUnauthorized();
        }
    }

    // -------------------------------------------------------------------------
    // Protect /dashboard/presenter routes - Require PRESENTER or ADMIN role
    // -------------------------------------------------------------------------
    if (pathname.startsWith("/dashboard/presenter")) {
        if (!user) {
            return redirectToLogin();
        }

        // Fetch user role from database
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !profile) {
            console.error('Profile fetch error in middleware:', error);
            return redirectToUnauthorized();
        }

        if (profile.role !== 'presenter' && profile.role !== 'admin') {
            return redirectToUnauthorized();
        }
    }

    // -------------------------------------------------------------------------
    // Protect /dashboard routes (general) - Require authentication only
    // -------------------------------------------------------------------------
    if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/presenter")) {
        if (!user) {
            return redirectToLogin();
        }
    }

    // -------------------------------------------------------------------------
    // Protect /api/admin routes - API-level protection (belt and suspenders)
    // Note: API routes also have their own protection via role-guards
    // -------------------------------------------------------------------------
    if (pathname.startsWith("/api/admin")) {
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized", code: "UNAUTHORIZED" },
                { status: 401 }
            );
        }

        // Fetch user role
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || !profile || profile.role !== 'admin') {
            return NextResponse.json(
                { error: "Forbidden: Admin access required", code: "FORBIDDEN" },
                { status: 403 }
            );
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets (svg, png, jpg, etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
