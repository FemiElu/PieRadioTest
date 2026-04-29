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
    console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // =========================================================================
    // 1. Supabase Session Refresh
    // =========================================================================
    const supabase = createServerClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
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
    // Protected Route Logic
    // Only perform expensive database role checks if the user is 
    // accessing a route that actually requires it.
    // -------------------------------------------------------------------------
    
    // 1. Admin Routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        if (!user) {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return redirectToLogin();
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return redirectToUnauthorized();
        }
    }

    // 2. Presenter & Dashboard Routes
    if (pathname.startsWith("/dashboard")) {
        if (!user) return redirectToLogin();

        // Specific presenter routes require further checks
        if (pathname.startsWith("/dashboard/presenter")) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!profile || (profile.role !== 'presenter' && profile.role !== 'admin')) {
                return redirectToUnauthorized();
            }
        }
    }

    // =========================================================================
    // 4. Finalize Response (Apply Security Headers)
    // =========================================================================

    // Explicitly add your project URL to ensure wildcard doesn't fail
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();

    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com blob:;
        worker-src 'self' blob:;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://*.supabase.co https://*.unsplash.com https://*.googleusercontent.com https://i.scdn.co https://cdn.discordapp.com https://*.mzstatic.com https://itunes.apple.com;
        font-src 'self' https://fonts.gstatic.com;
        connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co https://*.aiir.com https://api.stripe.com https://itunes.apple.com;
        media-src 'self' https://*.aiir.com ${supabaseUrl} https://*.supabase.co blob: data:;
        frame-src 'self' https://js.stripe.com;
    `.replace(/\s{2,}/g, " ").trim();

    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
}

export const config = {
    matcher: [
        /*
         * ONLY run middleware on paths that require authentication/authorization,
         * user-specific functionality, or auth flows:
         */
        "/admin/:path*",
        "/api/admin/:path*",
        "/dashboard/:path*",
        "/profile/:path*",
        "/chat/:path*",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
    ],
};
