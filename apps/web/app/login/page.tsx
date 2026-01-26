"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Music, ShieldCheck, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const { signInWithGoogle, signInWithEmail, user, profile, isLoading } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get('redirect');

    useEffect(() => {
        if (!isLoading && user) {
            // Priority: Query Param Redirect > Role Based Redirect
            if (redirectPath) {
                router.push(redirectPath);
                return;
            }

            // Role based redirect
            if (profile) {
                if (profile.role === 'admin') {
                    router.push('/admin');
                } else if (profile.role === 'presenter') {
                    router.push('/dashboard/presenter');
                } else {
                    router.push('/');
                }
            } else {
                // Determine redirect based on profile being null?
                // Wait for profile to load or just go home
                // If profile is still loading we might want to wait, but isLoading usually covers auth+profile
                router.push('/');
            }
        }
    }, [user, profile, isLoading, router, redirectPath]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setIsSigningIn(true);
        try {
            await signInWithEmail(email, password);
            // Redirection is handled by the useEffect above once user state updates
        } catch (error: any) {
            console.error("Login failed", error);
            setError(error.message || "Invalid email or password");
            setIsSigningIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSigningIn(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google login failed", error);
            setIsSigningIn(false);
        }
    };

    // If already authenticated, show loading while redirecting
    if (user && !isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                        <div className="space-y-2">
                            <h2 className="text-5xl font-bold font-display leading-tight">
                                Your Sound, <br />
                                <span className="text-primary">Your Soul.</span>
                            </h2>
                            <p className="text-xl text-white/60 font-medium max-w-md">
                                Sign in to unlock exclusive features, chat with presenters, and control your music experience.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold">Secure Access</p>
                                    <p className="text-sm text-white/40 font-medium">Industry standard encryption</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-white/40 font-medium">
                        &copy; 2025 PIE RADIO. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#fcfcfd]">
                <div className="w-full max-w-md space-y-10">
                    <div className="space-y-3">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black font-display tracking-tight italic">PIE RADIO</span>
                        </div>
                        <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Welcome back</h1>
                        <p className="text-lg text-zinc-500 font-medium">Please enter your details to sign in.</p>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
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

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-zinc-700">Password</label>
                                    <Link href="/forgot-password" title="Go to Forgot Password" className="text-xs text-primary font-bold cursor-pointer hover:underline">Forgot Password?</Link>
                                </div>
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
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/25"
                            disabled={isSigningIn || isLoading}
                        >
                            {isSigningIn ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-100" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-zinc-300">
                            <span className="bg-[#fcfcfd] px-4">or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 w-full relative rounded-2xl border-2 hover:bg-zinc-50 transition-all font-bold gap-3"
                        onClick={handleGoogleLogin}
                        disabled={isSigningIn || isLoading}
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign in with Google
                    </Button>

                    <p className="text-center text-sm text-zinc-500 font-medium">
                        Don&apos;t have an account? <Link href="/signup" className="text-primary font-bold cursor-pointer hover:underline">Join the team</Link>
                    </p>

                    <div className="pt-8 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center justify-center gap-6">
                        <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <span className="hover:text-primary transition-colors cursor-pointer">Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
