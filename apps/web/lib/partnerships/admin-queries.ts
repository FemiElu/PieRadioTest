import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@packages/types";
import { CreatePartnershipSchema } from "./schema";
import type { PartnershipPageRow } from "./queries";
import type { PartnershipStatus, PartnershipSummary, PartnershipWorkspaceResponse } from "./admin-types";
import { getPartnershipPublishIssues } from "@/components/partnerships/default-content";

function safeImage(value: string | undefined): string | null {
    if (!value) return null;
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    try { return ["https:", "http:"].includes(new URL(value).protocol) ? value : null; }
    catch { return null; }
}

export function summarizePartnership(row: PartnershipPageRow): PartnershipSummary {
    const parsed = CreatePartnershipSchema.safeParse(row);
    return {
        id: row.id, title: row.title, slug: row.slug, brand_name: row.brand_name,
        status: row.status as PartnershipStatus, updated_at: row.updated_at,
        thumbnail_url: safeImage(row.social_image_url) ?? (parsed.success
            ? safeImage(parsed.data.content.hero.background.src) ?? safeImage(parsed.data.content.hero.partnerLogo.src)
            : null),
        content_valid: parsed.success,
        publish_issues: parsed.success
            ? getPartnershipPublishIssues(parsed.data)
            : ["This saved page contains invalid content. Review its validation notice before publishing."],
    };
}

export async function getPartnershipAdminRecord(supabase: SupabaseClient<Database>, id: string): Promise<PartnershipPageRow | null> {
    const { data, error } = await supabase.from("partnership_pages").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Partnership lookup failed: ${error.message}`);
    return data;
}

export async function getPartnershipWorkspace(
    supabase: SupabaseClient<Database>, status: PartnershipStatus, requestedPage: number,
): Promise<Pick<PartnershipWorkspaceResponse, "pages" | "meta">> {
    const statuses: PartnershipStatus[] = ["draft", "published", "archived"];
    const countResults = await Promise.all(statuses.map(value => supabase.from("partnership_pages")
        .select("id", { count: "exact", head: true }).eq("status", value)));
    const counts = { draft: 0, published: 0, archived: 0 };
    countResults.forEach((result, index) => {
        if (result.error) throw new Error(`Partnership counts failed: ${result.error.message}`);
        counts[statuses[index]] = result.count ?? 0;
    });
    const total = counts[status];
    const totalPages = Math.max(1, Math.ceil(total / 3));
    const page = Math.min(requestedPage, totalPages);
    const first = (page - 1) * 3;
    const { data, error } = await supabase.from("partnership_pages").select("*").eq("status", status)
        .order("updated_at", { ascending: false }).order("id", { ascending: false }).range(first, first + 2);
    if (error) throw new Error(`Partnership list failed: ${error.message}`);
    return { pages: (data ?? []).map(summarizePartnership), meta: { page, pageSize: 3, total, totalPages, counts } };
}
