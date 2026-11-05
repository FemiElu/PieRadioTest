import { PartnershipWorkspace } from "@/components/admin/partnership-workspace";

export default async function PartnershipDraftsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams;
    return <PartnershipWorkspace status="draft" page={Math.max(1, Number.parseInt(page ?? "1", 10) || 1)} />;
}
