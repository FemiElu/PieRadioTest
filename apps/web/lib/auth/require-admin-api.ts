import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type AdminApiAccess = { user: User; error: null } | { user: null; error: NextResponse };

export async function getAdminApiAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<AdminApiAccess> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || profile?.role !== "admin") {
        return { user: null, error: NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 }) };
    }
    return { user, error: null };
}

export async function requireAdminApi(supabase: Awaited<ReturnType<typeof createClient>>) {
    return (await getAdminApiAccess(supabase)).error;
}
