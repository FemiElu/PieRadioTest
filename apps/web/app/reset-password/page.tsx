"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Music, Lock, Eye, EyeOff, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ResetPasswordPage() {
    const { updatePassword, session, isLoading: authLoading } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const hasInvalidSession = !authLoading && !session && !isSuccess;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            await updatePassword(password);
            setIsSuccess(true);
            // Redirect after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (error: any) {
            console.error("Update password error:", error);
            setError(error.message || "Failed to update password. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fcfcfd]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg font-medium text-zinc-500">Verifying your reset link...</p>
                </div>
            </div>
        );
    }

    if (hasInvalidSession) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fcfcfd] p-8">
                <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-100 bg-white p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black font-display tracking-tight text-[#141827]">
                            Invalid or Expired Link
                        </h1>
                        <p className="text-zinc-500 font-medium leading-relaxed">
                            Your password reset link may have expired or is invalid. Please request a new one.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold"
                        asChild
                    >
                        <Link href="/forgot-password">Request New Link</Link>
                    </Button>
                </div>
            </div>
        );
    }

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
                            Secure your <br />
                            <span className="text-primary">Account.</span>
                        </h2>
                        <p className="text-xl text-white/60 font-medium max-w-md">
                            Create a strong new password to protect your account and get back to the music.
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

                        {!isSuccess ? (
                            <>
                                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">New Password</h1>
                                <p className="text-lg text-zinc-500 font-medium">Please enter your new password below.</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Password Updated</h1>
                                <p className="text-lg text-zinc-500 font-medium">
                                    Success! Your password has been changed. Redirecting to login...
                                </p>
                            </div>
                        )}
                    </div>

                    {!isSuccess ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-zinc-700">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-10 h-12 rounded-xl border-zinc-200 bg-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-zinc-700">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-zinc-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full pl-10 h-12 rounded-xl border-zinc-200 bg-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/25"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full h-14 rounded-2xl border-2 hover:bg-zinc-50 font-bold"
                            asChild
                        >
                            <Link href="/login">Return to Sign In Now</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
