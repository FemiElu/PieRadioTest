import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnershipById } from "@/lib/partnerships/queries";
import { PartnershipPageView } from "@/components/partnerships/partnership-page";

export default async function PreviewPartnershipPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const page = await getPartnershipById(await createClient(), id);
    if (!page) notFound();
    return <PartnershipPageView page={page} preview />;
}
