import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@packages/types";
import { PartnershipContentSchema, type PartnershipContent } from "./schema";

export type PartnershipPageRow = Database["public"]["Tables"]["partnership_pages"]["Row"];

export type PartnershipPage = Omit<PartnershipPageRow, "content"> & {
    content: PartnershipContent;
};

function parseContent(row: PartnershipPageRow): PartnershipPage | null {
    const parsed = PartnershipContentSchema.safeParse(row.content);
    return parsed.success ? { ...row, content: parsed.data } : null;
}

export async function getPartnershipBySlug(
    supabase: SupabaseClient<Database>,
    slug: string,
): Promise<PartnershipPage | null> {
    const { data, error } = await supabase
        .from("partnership_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (error) {
        console.error("[partnerships] public lookup failed:", error.message);
        return null;
    }
    return data ? parseContent(data) : null;
}

export async function getPartnershipById(
    supabase: SupabaseClient<Database>,
    id: string,
): Promise<PartnershipPage | null> {
    const { data, error } = await supabase
        .from("partnership_pages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("[partnerships] admin lookup failed:", error.message);
        return null;
    }
    return data ? parseContent(data) : null;
}

export async function getPartnershipsAdmin(
    supabase: SupabaseClient<Database>,
): Promise<PartnershipPage[]> {
    const { data, error } = await supabase
        .from("partnership_pages")
        .select("*")
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("[partnerships] admin list failed:", error.message);
        return [];
    }
    return (data ?? []).flatMap((row) => {
        const page = parseContent(row);
        return page ? [page] : [];
    });
}
