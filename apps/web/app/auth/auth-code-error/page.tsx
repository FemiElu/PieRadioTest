"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorMessage = error
        ? decodeURIComponent(error)
        : "An unknown error occurred during authentication.";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-zinc-100 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <ShieldAlert className="h-8 w-8 text-red-600" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black font-display tracking-tight text-zinc-900">
                        Authentication Failed
                    </h1>
                    <p className="text-zinc-500 font-medium leading-relaxed">
                        {errorMessage}
                    </p>
                </div>

                <div className="pt-4">
                    <Link href="/login">
                        <Button className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-all">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <AuthErrorContent />
        </Suspense>
    );
}
