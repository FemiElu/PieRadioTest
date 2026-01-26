"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@packages/types";
import { useRouter } from "next/navigation";

// Define the shape of our Auth Context
interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
    resetPasswordForEmail: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // 1. Check active session
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    // Fetch profile in the background, don't block isLoading
                    fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                // Ensure loading is false even if profile fetch hasn't finished
                setIsLoading(false);
            }
        };

        initSession();

        // 2. Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Background fetch if profile is missing or different user
                if (!profile || profile.id !== session.user.id) {
                    fetchProfile(session.user.id);
                }
            } else {
                setProfile(null);
            }

            // Always clear loading on auth change events
            setIsLoading(false);

            if (event === 'SIGNED_OUT') {
                router.refresh();
                router.push('/');
            }

            if (event === 'PASSWORD_RECOVERY') {
                router.push('/reset-password');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.warn("Profile fetch error:", error.message);
                return;
            }

            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.error("Unexpected error fetching profile:", err);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Sign out error:", error);
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUpWithEmail = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) throw error;
    };

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    };
    const resetPasswordForEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });
        if (error) throw error;
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPasswordForEmail, updatePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
