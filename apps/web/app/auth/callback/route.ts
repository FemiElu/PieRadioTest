import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";
    const type = searchParams.get("type");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");

    // If this is a password recovery link, force redirect to reset-password
    const redirectPath = type === 'recovery' ? '/reset-password' : next;

    if (error) {
        console.error("Auth error in callback:", error, error_description);
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || "unknown_error")}`);
    }

    if (code) {
        const supabase = await createClient();
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectPath}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
            } else {
                return NextResponse.redirect(`${origin}${redirectPath}`);
            }
        } else {
            console.error("Exchange code error:", exchangeError);
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`);
        }
    }

    // Default error if no code is present
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code_provided`);
}
