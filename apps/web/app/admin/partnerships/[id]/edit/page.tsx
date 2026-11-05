import { notFound } from "next/navigation";
import Link from "next/link";
import { PartnershipForm } from "@/components/admin/partnership-form";
import { createClient } from "@/lib/supabase/server";
import { getPartnershipAdminRecord } from "@/lib/partnerships/admin-queries";
import { CreatePartnershipSchema } from "@/lib/partnerships/schema";

export default async function EditPartnershipPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const page = await getPartnershipAdminRecord(await createClient(), id);
    if (!page) notFound();
    const parsed = CreatePartnershipSchema.safeParse(page);
    if (!parsed.success) return <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-8"><h1 className="text-2xl font-bold text-[#141827]">This draft needs content review</h1><p className="text-sm text-amber-950">“{page.title}” is saved, but some stored content could not be read safely. It has not been removed or changed.</p><ul className="list-disc space-y-1 pl-5 text-sm text-amber-950">{parsed.error.issues.map((issue, index) => <li key={index}>{issue.path.join(".")}: {issue.message}</li>)}</ul><Link href="/admin/partnerships/drafts" className="inline-block font-semibold text-primary underline">Back to drafts</Link></div>;
    return <PartnershipForm initialData={{ ...page, content: parsed.data.content }} />;
}
