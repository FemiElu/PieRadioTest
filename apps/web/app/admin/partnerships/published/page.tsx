import { PartnershipWorkspace } from "@/components/admin/partnership-workspace";

export default async function PublishedPartnershipsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams;
    return <PartnershipWorkspace status="published" page={Math.max(1, Number.parseInt(page ?? "1", 10) || 1)} />;
}
