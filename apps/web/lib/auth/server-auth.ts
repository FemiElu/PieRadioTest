/**
 * Server-Side Authentication Utilities for Server Components
 * 
 * These utilities provide server-side authentication and role verification
 * specifically designed for use in Next.js Server Components.
 * They use redirect() instead of throwing errors for seamless UX.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Database } from '@packages/types';
import type { User } from '@supabase/supabase-js';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

interface ServerAuthResult {
    user: User;
    profile: Profile;
}

// ============================================================================
// NON-THROWING AUTH CHECK
// ============================================================================

/**
 * Get the current authenticated user and profile without throwing.
 * Use this when authentication is optional.
 * 
 * @returns User and profile if authenticated, nulls otherwise
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function Page() {
 *   const { user, profile } = await getServerAuth();
 *   
 *   if (user) {
 *     return <AuthenticatedView profile={profile} />;
 *   }
 *   return <GuestView />;
 * }
 * ```
 */
export async function getServerAuth(): Promise<{ user: ServerAuthResult['user'] | null; profile: Profile | null }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return { user, profile };
}

// ============================================================================
// REDIRECTING AUTH GUARDS (for Server Components)
// ============================================================================

/**
 * Require authentication in a Server Component.
 * Redirects to login page if not authenticated.
 * 
 * @param redirectTo - Where to redirect after login (defaults to current path)
 * @returns User and profile data
 * 
 * @example
 * ```tsx
 * // In a protected Server Component
 * export default async function DashboardPage() {
 *   const { user, profile } = await requireServerAuth();
 *   return <Dashboard profile={profile} />;
 * }
 * ```
 */
export async function requireServerAuth(redirectTo?: string): Promise<ServerAuthResult> {
    const { user, profile } = await getServerAuth();

    if (!user || !profile) {
        const loginUrl = redirectTo
            ? `/login?redirect=${encodeURIComponent(redirectTo)}`
            : '/login';
        redirect(loginUrl);
    }

    return { user, profile };
}

/**
 * Require a specific role in a Server Component.
 * Redirects to unauthorized page if role doesn't match.
 * 
 * @param role - Required role
 * @param redirectTo - Custom redirect for login (defaults to /login)
 * @returns User and profile data
 * 
 * @example
 * ```tsx
 * // In an admin-only Server Component
 * export default async function AdminPage() {
 *   const { user, profile } = await requireServerRole('admin');
 *   return <AdminDashboard profile={profile} />;
 * }
 * ```
 */
export async function requireServerRole(
    role: UserRole,
    redirectTo?: string
): Promise<ServerAuthResult> {
    const { user, profile } = await requireServerAuth(redirectTo);

    if (profile.role !== role) {
        redirect('/unauthorized');
    }

    return { user, profile };
}

/**
 * Require any of the specified roles in a Server Component.
 * Redirects to unauthorized page if user has none of the roles.
 * 
 * @param roles - Array of acceptable roles
 * @param redirectTo - Custom redirect for login (defaults to /login)
 * @returns User and profile data
 * 
 * @example
 * ```tsx
 * // In a presenter/admin Server Component
 * export default async function PresenterPage() {
 *   const { user, profile } = await requireServerAnyRole(['presenter', 'admin']);
 *   return <PresenterDashboard profile={profile} />;
 * }
 * ```
 */
export async function requireServerAnyRole(
    roles: UserRole[],
    redirectTo?: string
): Promise<ServerAuthResult> {
    const { user, profile } = await requireServerAuth(redirectTo);

    if (!profile.role || !roles.includes(profile.role)) {
        redirect('/unauthorized');
    }

    return { user, profile };
}

/**
 * Require admin role in a Server Component.
 * Convenience wrapper for requireServerRole('admin').
 */
export async function requireServerAdmin(redirectTo?: string): Promise<ServerAuthResult> {
    return requireServerRole('admin', redirectTo);
}

/**
 * Require presenter or admin role in a Server Component.
 * Convenience wrapper for presenter-level access.
 */
export async function requireServerPresenterOrAdmin(redirectTo?: string): Promise<ServerAuthResult> {
    return requireServerAnyRole(['presenter', 'admin'], redirectTo);
}

// ============================================================================
// ROLE CHECK UTILITIES (for conditional rendering)
// ============================================================================

/**
 * Check if the current user has a specific role.
 * Non-throwing, for use in conditional rendering.
 */
export async function serverHasRole(role: UserRole): Promise<boolean> {
    const { profile } = await getServerAuth();
    return profile?.role === role;
}

/**
 * Check if the current user has any of the specified roles.
 * Non-throwing, for use in conditional rendering.
 */
export async function serverHasAnyRole(roles: UserRole[]): Promise<boolean> {
    const { profile } = await getServerAuth();
    return profile?.role !== null && profile?.role !== undefined && roles.includes(profile.role);
}

/**
 * Check if the current user is an admin.
 */
export async function serverIsAdmin(): Promise<boolean> {
    return serverHasRole('admin');
}

/**
 * Check if the current user is a presenter or admin.
 */
export async function serverIsPresenterOrAdmin(): Promise<boolean> {
    return serverHasAnyRole(['presenter', 'admin']);
}
