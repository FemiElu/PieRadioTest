import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isSafeNext(next: string): boolean {
    return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
}

function resolveRedirectPath(type: string | null, next: string): string {
    if (type === "recovery") {
        return "/reset-password";
    }

    if (isSafeNext(next)) {
        return next;
    }

    return "/";
}

function buildRedirectUrl(request: NextRequest, path: string): string {
    const { origin } = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (isLocalEnv) {
        return `${origin}${path}`;
    }

    if (forwardedHost) {
        return `https://${forwardedHost}${path}`;
    }

    return `${origin}${path}`;
}

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const next = searchParams.get("next") ?? "/";
    const type = searchParams.get("type");
    const error = searchParams.get("error");
    const error_description = searchParams.get("error_description");
    const redirectPath = resolveRedirectPath(type, next);

    if (error) {
        console.error("Auth error in callback:", error, error_description);
        return NextResponse.redirect(
            `${origin}/auth/auth-code-error?error=${encodeURIComponent(error_description || "unknown_error")}`
        );
    }

    const supabase = await createClient();

    if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (!exchangeError) {
            return NextResponse.redirect(buildRedirectUrl(request, redirectPath));
        }

        console.error("Exchange code error:", exchangeError);
        return NextResponse.redirect(
            `${origin}/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message)}`
        );
    }

    if (token_hash && type) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as EmailOtpType,
        });

        if (!verifyError) {
            const finalPath = type === "recovery" ? "/reset-password" : redirectPath;
            return NextResponse.redirect(buildRedirectUrl(request, finalPath));
        }

        console.error("Verify OTP error:", verifyError);
        return NextResponse.redirect(
            `${origin}/auth/auth-code-error?error=${encodeURIComponent(verifyError.message)}`
        );
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code_provided`);
}
