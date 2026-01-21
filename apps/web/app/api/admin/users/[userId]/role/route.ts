import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
    requireAdmin,
    handleAuthError,
    isAuthError,
    type UserRole
} from "@/lib/auth/role-guards";

const VALID_ROLES: UserRole[] = ['listener', 'presenter', 'admin'];

/**
 * PATCH /api/admin/users/[userId]/role
 * 
 * Update a user's role. Admin only.
 * 
 * Body:
 * - role: 'listener' | 'presenter' | 'admin' (required)
 * - reason: string (optional) - Reason for role change
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Require admin role
        const { user: adminUser, profile: adminProfile } = await requireAdmin();

        // 2. Get and validate params
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // 3. Parse and validate request body
        const body = await request.json();
        const { role, reason } = body;

        if (!role || !VALID_ROLES.includes(role)) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
                { status: 400 }
            );
        }

        // 4. Prevent admin from changing their own role
        if (userId === adminUser.id) {
            return NextResponse.json(
                { error: "Cannot change your own role" },
                { status: 400 }
            );
        }

        // 5. Get Supabase client
        const supabase = await createClient();

        // 6. Verify target user exists
        const { data: targetUser, error: fetchError } = await supabase
            .from('profiles')
            .select('id, role, email, username')
            .eq('id', userId)
            .single();

        if (fetchError || !targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // 7. Check if role is actually changing
        if (targetUser.role === role) {
            return NextResponse.json(
                { message: "User already has this role", role },
                { status: 200 }
            );
        }

        // 8. Update user role
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                role,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Role update error:", updateError);
            throw new Error("Failed to update user role");
        }

        // 9. Log success (audit trail is handled by database trigger)
        console.log(`Role changed: ${targetUser.email || targetUser.username} from ${targetUser.role} to ${role} by ${adminProfile.email || adminProfile.username}`);

        return NextResponse.json({
            success: true,
            message: "User role updated successfully",
            user_id: userId,
            old_role: targetUser.role,
            new_role: role,
            changed_by: adminProfile.username || adminUser.email
        });

    } catch (error: unknown) {
        if (isAuthError(error)) {
            return handleAuthError(error);
        }

        console.error("Role update API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/users/[userId]/role
 * 
 * Get a user's current role. Admin only.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // 1. Require admin role
        await requireAdmin();

        // 2. Get params
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // 3. Get Supabase client
        const supabase = await createClient();

        // 4. Fetch user role
        const { data: user, error } = await supabase
            .from('profiles')
            .select('id, role, email, username, full_name')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user_id: user.id,
            role: user.role,
            email: user.email,
            username: user.username,
            full_name: user.full_name
        });

    } catch (error: unknown) {
        if (isAuthError(error)) {
            return handleAuthError(error);
        }

        console.error("Get role API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
