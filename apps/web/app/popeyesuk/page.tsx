import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnershipBySlug } from "@/lib/partnerships/queries";
import { PartnershipPageView } from "@/components/partnerships/partnership-page";

export async function generateMetadata(): Promise<Metadata> {
    const page = await getPartnershipBySlug(await createClient(), "popeyesuk");
    return page ? { title: page.title, description: page.description, openGraph: { title: page.title, description: page.description, images: page.social_image_url ? [page.social_image_url] : undefined } } : {};
}

export default async function PopeyesUkPage() {
    const page = await getPartnershipBySlug(await createClient(), "popeyesuk");
    if (!page) notFound();
    return <PartnershipPageView page={page} />;
}
