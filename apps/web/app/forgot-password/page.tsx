"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const { resetPasswordForEmail } = useAuth();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setIsLoading(true);
        try {
            await resetPasswordForEmail(email);
            setIsSubmitted(true);
        } catch (error: any) {
            console.error("Reset password error:", error);
            setError(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Brand & Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#141827] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/hero-main.jpg"
                        alt="Pie Radio Background"
                        fill
                        className="object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#334aff]/20 via-transparent to-black/80" />
                </div>

                <div className="relative z-10 w-full p-16 flex flex-col justify-between text-white">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
                            <Music className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black font-display tracking-tight italic">PIE RADIO</span>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-5xl font-bold font-display leading-tight">
                            Reset your <br />
                            <span className="text-primary">Password.</span>
                        </h2>
                        <p className="text-xl text-white/60 font-medium max-w-md">
                            Don't worry, it happens. Just enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <p className="text-sm text-white/40 font-medium">
                        &copy; 2025 PIE RADIO. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#fcfcfd]">
                <div className="w-full max-w-md space-y-10">
                    <div className="space-y-3">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black font-display tracking-tight italic">PIE RADIO</span>
                        </div>

                        {!isSubmitted ? (
                            <>
                                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Forgot Password?</h1>
                                <p className="text-lg text-zinc-500 font-medium">Enter your email for reset instructions.</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Check your email</h1>
                                <p className="text-lg text-zinc-500 font-medium">
                                    We&apos;ve sent password reset instructions to <span className="text-[#141827] font-bold">{email}</span>.
                                </p>
                            </div>
                        )}
                    </div>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-zinc-700">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-10 h-12 rounded-xl border-zinc-200 bg-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/25"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Send Instructions"
                                )}
                            </Button>

                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-sm text-center text-zinc-500 font-medium">
                                Didn&apos;t receive the email? Check your spam folder or{" "}
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="text-primary font-bold hover:underline"
                                >
                                    try again with a different email
                                </button>.
                            </p>

                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-14 rounded-2xl border-2 hover:bg-zinc-50 font-bold"
                                asChild
                            >
                                <Link href="/login">Return to Sign In</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
