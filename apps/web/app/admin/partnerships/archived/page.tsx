import { PartnershipWorkspace } from "@/components/admin/partnership-workspace";

export default async function ArchivedPartnershipsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams;
    return <PartnershipWorkspace status="archived" page={Math.max(1, Number.parseInt(page ?? "1", 10) || 1)} />;
}
