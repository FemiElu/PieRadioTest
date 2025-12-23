/**
 * Mobile Authentication Context
 * 
 * Provides authentication state and methods for the mobile app.
 * Mirrors the web app's auth-context with mobile-specific adaptations.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@packages/types';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

// Types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Enums']['user_role'];

interface AuthContextType {
    // State
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Auth methods
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;

    // Profile methods
    refreshProfile: () => Promise<void>;

    // Role helpers
    hasRole: (role: UserRole) => boolean;
    hasAnyRole: (roles: UserRole[]) => boolean;
    isAdmin: () => boolean;
    isPresenter: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Enable Web Browser result handling
WebBrowser.maybeCompleteAuthSession();

/**
 * Authentication Provider Component
 * 
 * Wrap your app with this provider to enable authentication throughout.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // =========================================================================
    // Profile Fetching
    // =========================================================================

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Profile fetch error:', error);
                return;
            }

            setProfile(data);
        } catch (error) {
            console.error('Profile fetch exception:', error);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    }, [user, fetchProfile]);

    // =========================================================================
    // Session Initialization & Listening
    // =========================================================================

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Session fetch error:', error);
                    return;
                }

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (error) {
                console.error('Session init error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);

                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchProfile(session.user.id);
                } else {
                    setProfile(null);
                }

                setIsLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // =========================================================================
    // Authentication Methods
    // =========================================================================

    /**
     * Sign in with email and password
     */
    const signInWithEmail = async (email: string, password: string) => {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) throw error;
        } catch (error) {
            const authError = error as AuthError;
            Alert.alert('Login Failed', authError.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Sign up with email and password
     */
    const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            // Show success message
            Alert.alert(
                'Check Your Email',
                'We sent you a confirmation link. Please check your email to complete registration.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            const authError = error as AuthError;
            Alert.alert('Sign Up Failed', authError.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Sign in with Google OAuth
     */
    const signInWithGoogle = async () => {
        try {
            // Get the redirect URL for deep linking
            const redirectUrl = Linking.createURL('auth/callback');

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Open the OAuth URL in a web browser
                const result = await WebBrowser.openAuthSessionAsync(
                    data.url,
                    redirectUrl
                );

                if (result.type === 'success' && result.url) {
                    // Extract the tokens from the URL
                    const url = new URL(result.url);
                    const accessToken = url.searchParams.get('access_token');
                    const refreshToken = url.searchParams.get('refresh_token');

                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            Alert.alert('Login Failed', 'Unable to sign in with Google. Please try again.');
            throw error;
        }
    };

    /**
     * Sign out
     */
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            setUser(null);
            setSession(null);
            setProfile(null);
        } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Unable to sign out. Please try again.');
            throw error;
        }
    };

    // =========================================================================
    // Role Helper Methods
    // =========================================================================

    const hasRole = useCallback((role: UserRole): boolean => {
        return profile?.role === role;
    }, [profile]);

    const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
        return profile?.role !== null && roles.includes(profile?.role as UserRole);
    }, [profile]);

    const isAdmin = useCallback((): boolean => {
        return hasRole('admin');
    }, [hasRole]);

    const isPresenter = useCallback((): boolean => {
        return hasRole('presenter') || hasRole('admin');
    }, [hasRole]);

    // =========================================================================
    // Context Value
    // =========================================================================

    const value: AuthContextType = {
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
        hasRole,
        hasAnyRole,
        isAdmin,
        isPresenter,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access authentication context
 * 
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

/**
 * Hook for role-based access control
 * 
 * @param requiredRole - Required role(s) for access
 * @returns Object with access status and role info
 */
export function useRoleAccess(requiredRole: UserRole | UserRole[]) {
    const { profile, isLoading, isAuthenticated } = useAuth();

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasAccess = profile?.role !== null && roles.includes(profile?.role as UserRole);

    return {
        hasAccess,
        isLoading,
        isAuthenticated,
        currentRole: profile?.role,
        requiredRoles: roles,
    };
}
