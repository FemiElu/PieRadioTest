import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnershipBySlug } from "@/lib/partnerships/queries";
import { PartnershipPageView } from "@/components/partnerships/partnership-page";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const page = await getPartnershipBySlug(await createClient(), slug);
    return page ? { title: page.title, description: page.description, openGraph: { title: page.title, description: page.description, images: page.social_image_url ? [page.social_image_url] : undefined } } : {};
}

export default async function PartnershipBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getPartnershipBySlug(await createClient(), slug);
    if (!page) notFound();
    return <PartnershipPageView page={page} />;
}
