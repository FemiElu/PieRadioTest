"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Music, ShieldCheck, Mail, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
    const { signUpWithEmail, signInWithGoogle, user, isLoading } = useAuth();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    if (user && !isLoading) {
        router.push("/"); // Already logged in
        return null;
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fullName || !email || !password || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSigningUp(true);
        try {
            await signUpWithEmail(email, password, fullName);
            // Sign up successful - usually triggers a confirmation email
            // You might want to show a success message or redirect to a "check email" page
            // For now, we'll just redirect to login with a query param
            // But since signUpWithEmail in context handles errors, if we get here it's likely success
            // However, Supabase default is "Check your email".
            // Let's assume auto-login if email confirm is off, otherwise check email.
            // Safe bet:
            alert("Account created! Please check your email to verify your account.");
            router.push("/login");
        } catch (err: any) {
            console.error("Signup failed", err);
            setError(err.message || "Failed to create account");
        } finally {
            setIsSigningUp(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsSigningUp(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google login failed", error);
            setIsSigningUp(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side: Brand & Visual - Matching Login Page */}
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
                                Join the <br />
                                <span className="text-primary">Movement.</span>
                            </h2>
                            <p className="text-xl text-white/60 font-medium max-w-md">
                                Create an account to curate your playlist, follow your favorite shows, and never miss a beat.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 pt-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold">Music for You</p>
                                    <p className="text-sm text-white/40 font-medium">Personalized experience</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-white/40 font-medium">
                        &copy; 2025 PIE RADIO. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Side: Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#fcfcfd]">
                <div className="w-full max-w-md space-y-8">
                    <div className="space-y-3">
                        <div className="lg:hidden flex items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Music className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-black font-display tracking-tight italic">PIE RADIO</span>
                        </div>
                        <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Create Account</h1>
                        <p className="text-lg text-zinc-500 font-medium">Join us and start listening today.</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-zinc-700">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full pl-10 h-12 rounded-xl border-zinc-200 bg-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

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
                                <label className="text-sm font-bold text-zinc-700">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <input
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
                                        <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full pl-10 pr-10 h-12 rounded-xl border-zinc-200 bg-white shadow-sm focus:border-primary focus:ring focus:ring-primary/20 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
                                    >
                                        {showConfirmPassword ? (
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
                            disabled={isSigningUp || isLoading}
                        >
                            {isSigningUp ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Create Account"
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
                        disabled={isSigningUp || isLoading}
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
                        Sign up with Google
                    </Button>

                    <p className="text-center text-sm text-zinc-500 font-medium">
                        Already have an account? <Link href="/login" className="text-primary font-bold cursor-pointer hover:underline">Sign In</Link>
                    </p>

                    <div className="pt-2 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center justify-center gap-6">
                        <span className="hover:text-primary transition-colors cursor-pointer">Terms</span>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <span className="hover:text-primary transition-colors cursor-pointer">Privacy</span>
                        <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                        <span className="hover:text-primary transition-colors cursor-pointer">Security</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
