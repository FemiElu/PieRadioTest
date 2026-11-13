import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@packages/types";

export type PartnershipNavigationLink = { id: string; slug: string; title: string };

export const PARTNERSHIPS_UPDATED_EVENT = "partnerships:updated";
const PAGE_SIZE = 500;

export function notifyPartnershipsUpdated() {
    window.dispatchEvent(new Event(PARTNERSHIPS_UPDATED_EVENT));
}

export async function getPublishedPartnershipLinks(
    supabase: SupabaseClient<Database>,
    signal: AbortSignal,
): Promise<PartnershipNavigationLink[]> {
    const links: PartnershipNavigationLink[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const { data, error } = await supabase
            .from("partnership_pages")
            .select("id,slug,title")
            .eq("status", "published")
            .order("title", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1)
            .abortSignal(signal);

        if (error) throw new Error(error.message);
        links.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) return links;
    }
}
