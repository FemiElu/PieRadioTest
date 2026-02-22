/**
 * Role Guard Utilities for Server-Side Role Verification
 * 
 * These utilities provide server-side role checking for API routes and Server Components.
 * They throw typed errors that can be caught and converted to appropriate HTTP responses.
 */

import { createClient } from '@/lib/supabase/server';
import { Database } from '@packages/types';

import type { User } from '@supabase/supabase-js';

export type UserRole = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

// ============================================================================
// CUSTOM ERROR TYPES
// ============================================================================

/**
 * Thrown when a user is not authenticated
 */
export class UnauthorizedError extends Error {
    public readonly statusCode = 401;

    constructor(message = 'Unauthorized: Authentication required') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Thrown when a user lacks the required role/permissions
 */
export class ForbiddenError extends Error {
    public readonly statusCode = 403;
    public readonly requiredRole?: UserRole | UserRole[];
    public readonly actualRole?: UserRole | null;

    constructor(
        message = 'Forbidden: Insufficient permissions',
        requiredRole?: UserRole | UserRole[],
        actualRole?: UserRole | null
    ) {
        super(message);
        this.name = 'ForbiddenError';
        this.requiredRole = requiredRole;
        this.actualRole = actualRole;
    }
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

interface AuthResult {
    user: User;
    profile: Profile;
}

/**
 * Get the currently authenticated user and their profile.
 * 
 * @throws {UnauthorizedError} If not authenticated or profile not found
 * @returns User and profile data
 * 
 * @example
 * ```ts
 * const { user, profile } = await requireAuth();
 * console.log(`Authenticated as ${profile.email} with role ${profile.role}`);
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new UnauthorizedError('Authentication required');
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        // User is authenticated but has no profile - this shouldn't happen with triggers
        throw new UnauthorizedError('User profile not found');
    }

    return { user, profile };
}

/**
 * Check if user is authenticated without throwing.
 * Useful for optional authentication scenarios.
 * 
 * @returns User and profile if authenticated, null otherwise
 */
export async function getAuth(): Promise<AuthResult | null> {
    try {
        return await requireAuth();
    } catch {
        return null;
    }
}

// ============================================================================
// ROLE VERIFICATION UTILITIES
// ============================================================================

/**
 * Require user to have a specific role.
 * 
 * @throws {UnauthorizedError} If not authenticated
 * @throws {ForbiddenError} If user doesn't have the required role
 * @returns User and profile data
 * 
 * @example
 * ```ts
 * // Only admins can access this
 * const { user, profile } = await requireRole('admin');
 * ```
 */
export async function requireRole(role: UserRole): Promise<AuthResult> {
    const { user, profile } = await requireAuth();

    if ((profile.role as UserRole) !== role) {
        throw new ForbiddenError(
            `Requires ${role} role`,
            role,
            (profile.role as UserRole) ?? null
        );
    }

    return { user, profile };
}

/**
 * Require user to have any of the specified roles.
 * 
 * @throws {UnauthorizedError} If not authenticated
 * @throws {ForbiddenError} If user doesn't have any of the required roles
 * @returns User and profile data
 * 
 * @example
 * ```ts
 * // Presenters and admins can access this
 * const { user, profile } = await requireAnyRole(['presenter', 'admin']);
 * ```
 */
export async function requireAnyRole(roles: UserRole[]): Promise<AuthResult> {
    const { user, profile } = await requireAuth();

    const userRole = (profile.role as UserRole) ?? null;
    if (!userRole || !roles.includes(userRole)) {
        throw new ForbiddenError(
            `Requires one of: ${roles.join(', ')}`,
            roles,
            userRole
        );
    }

    return { user, profile };
}

/**
 * Require user to be an admin.
 * Convenience wrapper around requireRole('admin').
 */
export async function requireAdmin(): Promise<AuthResult> {
    return requireRole('admin');
}

/**
 * Require user to be a presenter or admin.
 * Convenience wrapper for presenter-level access.
 */
export async function requirePresenterOrAdmin(): Promise<AuthResult> {
    return requireAnyRole(['presenter', 'admin']);
}

// ============================================================================
// NON-THROWING ROLE CHECKS
// ============================================================================

/**
 * Check if authenticated user has a specific role (non-throwing).
 * 
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(role: UserRole): Promise<boolean> {
    try {
        const { profile } = await requireAuth();
        return (profile.role as UserRole) === role;
    } catch {
        return false;
    }
}

/**
 * Check if authenticated user has any of the specified roles (non-throwing).
 * 
 * @returns true if user has any of the roles, false otherwise
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
    try {
        const { profile } = await requireAuth();
        const userRole = (profile.role as UserRole) ?? null;
        return userRole !== null && roles.includes(userRole);
    } catch {
        return false;
    }
}

/**
 * Check if authenticated user is an admin (non-throwing).
 */
export async function isAdmin(): Promise<boolean> {
    return hasRole('admin');
}

/**
 * Check if authenticated user is a presenter or admin (non-throwing).
 */
export async function isPresenterOrAdmin(): Promise<boolean> {
    return hasAnyRole(['presenter', 'admin']);
}

// ============================================================================
// API RESPONSE HELPERS
// ============================================================================

import { NextResponse } from 'next/server';

/**
 * Handle auth/role errors in API routes and return appropriate responses.
 * 
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   try {
 *     await requireAdmin();
 *     // ... admin-only logic
 *   } catch (error) {
 *     return handleAuthError(error);
 *   }
 * }
 * ```
 */
export function handleAuthError(error: unknown): NextResponse {
    if (error instanceof UnauthorizedError) {
        return NextResponse.json(
            { error: error.message, code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    if (error instanceof ForbiddenError) {
        return NextResponse.json(
            {
                error: error.message,
                code: 'FORBIDDEN',
                requiredRole: error.requiredRole,
            },
            { status: 403 }
        );
    }

    // Unknown error - log it and return generic 500
    console.error('Unexpected auth error:', error);
    return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
    );
}

/**
 * Type guard to check if an error is an auth-related error.
 */
export function isAuthError(error: unknown): error is UnauthorizedError | ForbiddenError {
    return error instanceof UnauthorizedError || error instanceof ForbiddenError;
}
